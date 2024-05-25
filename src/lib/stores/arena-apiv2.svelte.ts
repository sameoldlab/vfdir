// import { ArenaClient } from "arena-ts";
// const client = new ArenaClient({
//   //   fetch: ("https://api.are.na/v2/",)
// });
// let Channels = [];
// client.channels().then((val)=>{
//     // Channels = val
//     console.log(val)
//   })

export function getChannels() {
  let list = $state([]);
  fetch("https://api.are.na/v2/users/408713/channels?per=50", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "GET",
  }).then(async (res) => {
    const r = await res.json();
    console.log(r);
    list = r.channels;
  });

    return {
      get list() { return list }
    }
}

export function getContents(channel: string) {
  let list = $state([])
  fetch(`https://api.are.na/v2/channels/${channel}?per=100&sort=position&direction=desc`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer",
      },
      method: "GET",
    }).then(async (res) => {
      const r = await res.json();
      console.log(r);
      list = r.contents.reverse();
    });
    return {get list() {return list}}
}
