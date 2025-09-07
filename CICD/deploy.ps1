if (!(Test-Path C:\deploy\myapp)) {
  New-Item -ItemType Directory -Path C:\deploy\myapp
}

Copy-Item -Path ./dist/* -Destination C:\deploy\myapp -Recurse -Force