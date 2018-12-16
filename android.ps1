#Requires -Version 5
$ErrorActionPreference = "Stop"
Set-StrictMode -Version 2.0

Add-Type -Assembly 'System.IO.Compression.FileSystem'

# returns the path to the .zip file
function Build() {
    $dir = (Join-Path ([System.IO.Path]::GetTempPath()) 'chromeshack-android-build')
    Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    mkdir $dir | Out-Null

    $nameMappings = New-Object 'Collections.ArrayList'
    _CopyFiles -Prefix '' -SrcDir $PSScriptRoot -SrcRelativePath '' -DstDir $dir -NameMappings $nameMappings
    foreach ($file in [System.IO.Directory]::GetFiles($dir)) {
        _MangleFilenameReferencesInFile -FilePath $file -NameMappings $nameMappings
    }

    $localXpiFilePath = (Join-Path ([System.IO.Path]::GetTempPath()) 'chromeshack-temp.zip')
    Remove-Item -Force $localXpiFilePath -ErrorAction SilentlyContinue
    [System.IO.Compression.ZipFile]::CreateFromDirectory($dir, $localXpiFilePath)
    Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
    return $localXpiFilePath
}

# this will zip up the project folder and copy it onto an attached Android device.
# to install in Firefox for Android, navigate to file:///storage/self/primary/Documents/ in Firefox on the device
function Debug() {
    $localXpiFilePath = Build

    # this is the Documents folder in the internal storage on a Samsung Galaxy Tab S4
    & adb.exe push $localXpiFilePath '/storage/self/primary/Documents/chromeshack@electroly.com.xpi'

    Remove-Item -Force $localXpiFilePath -ErrorAction SilentlyContinue
}

# ---
# internal implementation
# ---

function _CopyFiles([string]$Prefix, [string]$SrcDir, [string]$SrcRelativePath, [string]$DstDir, [object]$NameMappings) {
    $PrefixDash = ''
    if ($Prefix -ne '') {
        $PrefixDash = "$Prefix-"
    }

    $SrcRelativePathSlash = ''
    if ($SrcRelativePath -ne '') {
        $SrcRelativePathSlash = "$SrcRelativePath/"
    }

    $files = [System.IO.Directory]::GetFiles($srcDir)
    foreach ($file in $files) {
        $originalName = [System.IO.Path]::GetFileName($file)
        $newName = $PrefixDash + $originalName
        $newPath = (Join-Path $DstDir $newName)
        if (-not $originalName.StartsWith('.')) {
            Copy-Item $file $newPath
            $NameMappings.Add([PSCustomObject]@{
                'RelativePath' = $SrcRelativePathSlash + $originalName
                'MangledName' = $newName
            }) | Out-Null
        }
    }

    $subdirs = [System.IO.Directory]::GetDirectories($srcDir)
    foreach ($subdir in $subdirs) {
        $subdirName = [System.IO.Path]::GetFileName($subdir)
        if (-not $subdirName.StartsWith('.')) {
            _CopyFiles -Prefix ($PrefixDash + $subdirName) -SrcDir $subdir -SrcRelativePath ($SrcRelativePathSlash + $subdirName) -DstDir $DstDir -NameMappings $NameMappings
        }
    }
}

function _MangleFilenameReferencesInFile([string]$FilePath, [object]$NameMappings) {
    $quotes = @( '"', "'" )
    $filename = [System.IO.Path]::GetFileName($FilePath)
    $extension = [System.IO.Path]::GetExtension($FilePath)
    if ($extension -eq '.html' -or $extension -eq '.js' -or $extension -eq '.json') {
        $content = [System.IO.File]::ReadAllText($FilePath)
        foreach ($nameMapping in $NameMappings) {
            foreach ($quote in $quotes) {
                $search = $quote + $nameMapping.RelativePath + $quote
                $replace = $quote + $nameMapping.MangledName + $quote
                $content = $content.Replace($search, $replace)
            }
        }

        if ($extension -eq '.js') {
            $content = $content.Replace('var isFirefoxAndroid = false;', 'var isFirefoxAndroid = true;');
        }

        if ($filename -eq 'manifest.json') {
            # remove the notifications permission on android
            $content = $content.Replace('"notifications",', '');
        }

        [System.IO.File]::WriteAllText($FilePath, $content)
    }
}
