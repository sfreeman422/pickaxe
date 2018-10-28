#!/bin/bash
backupDir() {
  echo "Backing up local minecraft data.."
  cp /home/sfreeman/kwaft/banned-ips.json /home/sfreeman/kwaft_update_backup/banned-ips.json
  cp /home/sfreeman/kwaft/banned-players.json /home/sfreeman/kwaft_update_backup/banned-players.json
  cp /home/sfreeman/kwaft/ops.json /home/sfreeman/kwaft_update_backup/ops.json
  cp /home/sfreeman/kwaft/server.properties /home/sfreeman/kwaft_update_backup/server.properties
  cp -r /home/sfreeman/kwaft/world /home/sfreeman/kwaft_update_backup/world
  echo "Backup complete!"
}

removeOldLocalFiles() {
  echo "Removing current local files..."
  rm /home/sfreeman/kwaft/banned-ips.json /home/sfreeman/kwaft_update_backup/banned-ips.json
  rm /home/sfreeman/kwaft/banned-players.json /home/sfreeman/kwaft_update_backup/banned-players.json
  rm /home/sfreeman/kwaft/ops.json /home/sfreeman/kwaft_update_backup/ops.json
  rm /home/sfreeman/kwaft/server.properties /home/sfreeman/kwaft_update_backup/server.properties
  rm -rf /home/sfreeman/kwaft/world
  echo "Successfully removed local files!"
}

beginUpdate() {
  URL="https://launchermeta.mojang.com/mc/game/version_manifest.json"
  echo "Querying ${URL}..."
  curl ${URL} > update_information.json
  latestRelease=$(cat update_information.json | jq '.latest.release')
  latestSnapshot=$(cat update_information.json | jq '.latest.snapshot')
  versions=$(cat update_information.json | jq '.versions')
  for i in "${versions[@]}"
  do
    echo $("${versions[$i]}" | jq '.id')
  done
  echo "Latest RELEASE version detected as: ${latestRelease}"
  echo "Latest SNAPSHOT version detected as: ${latestSnapshot}"
  currentLocalVersion=$(cat ./current_version.json | jq '.current')
  echo "Current version: ${currentLocalVersion}"
  if [ "$currentLocalVersion" != "$latestRelease" ]
  then
    echo "Version mismatch detected. Beginning update process..."
  else
    echo "Should not update"
  fi
}

beginUpdate
