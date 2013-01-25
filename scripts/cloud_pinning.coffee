# Pinning posts
# Author: Willie Zutz
# Date: 12/30/2012
# Notes: I stole a ton of code from the LOL script, so if it's broken... blame ThomW
Array::remove = (e) -> @[t..t] = [] if (t = @indexOf(e)) > -1

class PinList
	initializePinList: (success) =>
		username = @_getUsername()
		if(username.length is 0)
			return #Can't get a list for someone who's not logged in

		getUrl("https://shacknotify.bit-shift.com:12244/users/#{username}/settings", (res) =>
			if(res.status is 200)
				console.log("Got settings data: #{res.responseText}")
				@pinnedList = JSON.parse(res.responseText)['watched']
				success()
		)
		return

	addPinnedPost: (id, success) =>
		username = @_getUsername()
		if(username.length is 0)
			return #Can't get a list for someone who's not logged in

		if(!@pinnedList.contains(id))
			getUrl("https://shacknotify.bit-shift.com:12244/users/#{username}/settings", (res) =>
				if(res.status is 200)
					settingsData = JSON.parse(res.responseText)
					@pinnedList.push(parseInt(id))
					settingsData['watched'] = @pinnedList
					postUrl("https://shacknotify.bit-shift.com:12244/users/#{username}/settings", JSON.stringify(settingsData), (res) =>
						if(res.status is 200)
							if(success)
								success()
					)
			)
		return

	removePinnedPost: (id, success) =>
		username = @_getUsername()
		if(username.length is 0)
			return #Can't get a list for someone who's not logged in

		if(@pinnedList.contains(id))
			getUrl("https://shacknotify.bit-shift.com:12244/users/#{username}/settings", (res) =>
				if(res.status is 200)
					settingsData = JSON.parse(res.responseText)
					@pinnedList.remove(parseInt(id))
					settingsData['watched'] = @pinnedList
					postUrl("https://shacknotify.bit-shift.com:12244/users/#{username}/settings", JSON.stringify(settingsData), (res) =>
						if(res.status is 200)
							if(success)
								success()
					)
			)
		return

	isIdPinned: (id) =>
		unless (@pinnedList)
			return false

		return @pinnedList.contains(id)

	_getUsername: () =>
		unless(@username)
			masthead = document.getElementById("user")
			username = getDescendentByTagAndClassName(masthead, "li", "user")
			@username = stripHtml(username.innerHTML)

		unless(@username)
			return ''

		return @username

class Pinning
	@finishedLoadingPinList = false
	@loadingPinnedDiv = null

	constructor: (@pinOnReply) ->
		return

	initialize: () =>
		@pinText = "pin"
		@unpinText = "unpin"
		commentBlock = getDescendentByTagAndClassName(document.getElementById('content'), 'div', 'threads')
		@loadingPinnedDiv = document.createElement('div')
		s = document.createElement('span')
		s.innerText = 'Loading Pinned Posts'
		loadingImg = document.createElement('img')
		loadingImg.src = chrome.extension.getURL("../images/loading-pinned.gif")

		@loadingPinnedDiv.appendChild(s)
		@loadingPinnedDiv.appendChild(loadingImg)

		firstChattyComment = commentBlock.firstElementChild
		commentBlock.insertBefore(@loadingPinnedDiv, firstChattyComment)
		@pinList = new PinList()
		@pinList.initializePinList(@_listLoaded)
		return

	addPinLinks: (item, id, isRootPost) =>
		#Only add pin links to root posts.
		unless(isRootPost)
			return

		pinId = "pin_#{id}"

		#If we've already been added, don't do it again.
		if (document.getElementById(pinId))
			return

		authorElement = getDescendentByTagAndClassName(item, "span", "author")

		unless (authorElement)
			#Couldn't find the element we need to add to... bail.
			return

		newDiv = @_createElement(pinId, id, @finishedLoadingPinList)

		authorElement.appendChild(newDiv)
		return

	addPostBoxHandlers: () =>
		unless(@pinOnReply)
			return

		postform = document.getElementById("postform")
		if (postform)
			rootElement = @_findParentElementWithClassName(postform, 'root')
			if(rootElement)
				id = rootElement.id.replace('root_', '')
				#If we're not pinned, then we can pin after replying
				if(!@pinList.isIdPinned(id))
					console.log("Root post is not pinned and pinning on reply is enabled.")
					btn = document.getElementById("frm_submit")
					if(btn)
						console.log("Installing listener for root post id #{id}")
						btn.addEventListener('click', (e) =>
							@pinList.addPinnedPost(id, () =>
								console.log("Successfully pinned post after replying. Removing listener.")
								#this is .. gotta love javascript.
								btn.removeEventListener('click', arguments.callee)
								button = document.getElementById("pin_button_#{id}")
								if(button)
									button.innerHTML = @unpinText
								return
							)
							return
						)
		return

	_findParentElementWithClassName: (startingElement, className) =>
		if(startingElement.parentNode)
			if(startingElement.parentNode.classList.contains(className))
				return startingElement.parentNode
			else
				return @_findParentElementWithClassName(startingElement.parentNode, className)

		return null

	_listLoaded: () =>
		@finishedLoadingPinList = true

		if(@pinList.pinnedList.length > 0)
			pinnedDiv = document.createElement('div')
			pinnedDiv.classList.add('pinnedPosts')
			bannerImage = document.createElement('img')
			bannerImage.src = chrome.extension.getURL("../images/banners/pinned.png")
	#		title = document.createElement('span')
	#		title.classList.add('pinnedPostTitle')
	#		title.innerHTML = 'Pinned Posts'
			pinnedDiv.appendChild(bannerImage)

			for pinnedItem in @pinList.pinnedList
				pinButton = document.getElementById("pin_button_#{pinnedItem}")
				if(pinButton)
					pinButton.innerHTML = @unpinText
				#move existing thread if it's there
				el = document.getElementById("root_#{pinnedItem}")
				if(el)
					el.parentNode.removeChild(el)
					pinnedDiv.appendChild(el)
					#commentBlock.insertBefore(el, firstChattyComment)
				else
					#load it dynamically
					@_loadPinnedThread(pinnedItem, pinnedDiv)

		commentBlock = getDescendentByTagAndClassName(document.getElementById('content'), 'div', 'threads')
		commentBlock.removeChild(@loadingPinnedDiv)
		if(pinnedDiv)
			commentBlock.insertBefore(pinnedDiv, commentBlock.firstElementChild)
		return

	_loadPinnedThread: (threadId, pinnedSection, firstComment) =>
		getUrl("http://www.shacknews.com/chatty?id=#{threadId}", (res) =>
			doc = document.implementation.createHTMLDocument("example")
			doc.documentElement.innerHTML = res.responseText
			p = doc.getElementById("root_#{threadId}")
			pinnedSection.appendChild(p)
			#pinnedSection.insertBefore(p, firstComment)
			return
		)

	_buttonClicked: (elementId, postId) =>
		#Toggle pinning...
		button = document.getElementById(elementId)
		if(button)
			if(button.innerHTML is @pinText)
				@pinList.addPinnedPost(postId, () =>
					button.innerHTML = @unpinText
				)
			else
				@pinList.removePinnedPost(postId, () =>
					button.innerHTML = @pinText
				)
		return

	_createElement: (elementId, postId, pinsLoaded) =>
		div = document.createElement("div")
		div.id = elementId
		div.className = "pin"

		button = document.createElement("a")
		button.href = "#"
		button.id = "pin_button_#{postId}"
		button.className = 'pin_button'
		button.innerHTML = if(pinsLoaded and @pinList.isIdPinned(postId)) then @unpinText else @pinText
		if(pinsLoaded)
			console.log("Created button with id #{elementId} after pins loaded.")

		button.addEventListener("click", (e) =>
			@_buttonClicked(button.id, postId)
			e.preventDefault()
		)

		span = document.createElement("span")
		span.appendChild(document.createTextNode("["))
		span.appendChild(button)
		span.appendChild(document.createTextNode("]"))

		div.appendChild(span)
		return div

#Add hook for initializing ourselves if we're enabled.
settingsLoadedEvent.addHandler(() =>
	if (getSetting("enabled_scripts").contains("cloud_pinning"))
		@p = new Pinning(getSetting("pin_on_reply"))
		@p.initialize()
		processPostEvent.addHandler(@p.addPinLinks)
		processPostBoxEvent.addHandler(@p.addPostBoxHandlers)
	return
)