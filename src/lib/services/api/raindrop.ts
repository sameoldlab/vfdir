async function query(query: string, method: 'GET' | 'POST' | 'DELETE') {
	let res = await fetch(`https://api.raindrop.io/rest/v1/${query}`, {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${import.meta.env.VITE_RAINDROP_KEY}`,
		},
		method,
	})

	return res.json()
}
