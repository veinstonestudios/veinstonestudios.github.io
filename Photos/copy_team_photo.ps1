Copy-Item "C:\Users\huzey\.gemini\antigravity-ide\brain\76412981-f4cb-4e90-bb7a-ccd144a11d7a\media__1785499777631.jpg" -Destination "c:\UnityGames\veinstonestudios.github.io\Photos\VeinstoneTeamNew.jpg" -Force
Write-Host "Team photo copied successfully!"
Remove-Item $MyInvocation.MyCommand.Source -Force
