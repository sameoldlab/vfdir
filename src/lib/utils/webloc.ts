export function parseWebloc(contents: string) {
	if (!contents.includes('<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">')) throw Error('Invalid webloc file')
	const urlMatch = contents.match(/<string>(.*?)<\/string>/)
	return urlMatch ? new URL(urlMatch[1]) : null
}

export function createWebloc(url: string) {
	return `<?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>URL</key>
       <string>${url}</string>
   </dict>
   </plist>`
}
