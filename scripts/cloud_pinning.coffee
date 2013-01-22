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

	initialize: () =>
		@pinText = "pin"
		@unpinText = "unpin"
		@pinList = new PinList()
		@pinList.initializePinList(@_listLoaded)

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

	_listLoaded: () =>
		@finishedLoadingPinList = true
		for pinnedItem in @pinList.pinnedList
			pinButton = document.getElementById("pin_button_#{pinnedItem}")
			if(pinButton)
				pinButton.innerHTML = @unpinText

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
		@p = new Pinning()
		@p.initialize()
		processPostEvent.addHandler(@p.addPinLinks)
)