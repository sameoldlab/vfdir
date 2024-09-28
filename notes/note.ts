{
  title: '"simplicity" semantics', 
  created_at: '2023-02-04T13:39:06.995Z', 
  updated_at: '2023-06-15T15:38:55.933Z', 
  added_to_at: '2023-06-15T15:38:55.933Z', 
  published: true, 
  open: true, 
  collaboration: false, 
  collaborator_count: 0, 
  slug: 'simplicity-semantics', 
  length: 7, 
  kind: 'default', 
  status: 'public', 
  user_id: 408713, 
  metadata: [Object], 
  contents: [Array], 
  share_link: null, 
  follower_count: 0, 
  can_index: true, 
  owner_type: 'User', 
  owner_id: 408713, 
  owner_slug: 'sameoldlab', 
  'nsfw?': false, 
  state: 'available', 
  user: [Object],
  group: null,
  id: 1994310,
  base_class: 'Channel',
  class: 'Channel'
}  

type Channel = {
/** The internal ID of the channel */
	id: number
/** The title of the channel */
	title: string
/** Timestamp when the channel was created */
	created_at: Timestamp
/** Timestamp when the channel was last updated */
	updated_at: Timestamp
/** If channel is visible to all members of arena or not */
	published: boolean
/** If channel is open to other members of arena for adding blocks */
	open: boolean
/** The slug of the channel used in the url (e.g. http://are.na/arena-influences) */
	slug: string
/** Can be "private" (only open for reading and adding to the channel by channel author and 
 * collaborators), "closed" (open for reading by everyone, only channel author and 
 * collaborators can add) or "public" (everyone can read and add to the channel) 
*/
	status: string
/** Internal ID of the channel author */
	user_id: number
/** Can be either "default" (a standard channel) or "profile" the default channel of a user */
	kind: String
}

/** Number of followers the channel has */
type FollowingChannel = {
	channel_id: number
	user_id: number
}

User: {
/** If the channel has collaborators or not */
	collaboration: Boolean
/** More information on the channel author. Contains id, slug, first_name, last_name, full_name, avatar, email, channel_count, following_count, follower_count, and profile_id */
	user: Hash
}

Block: {
/** The number of items in a channel (blocks and other channels) */
	length: Integer
/** Array of blocks and other channels in the channel. Note: If the request is authenticated, this will include any private channels included in the requested channel that you have access to. If not, only public channels included in the requested channel will be shown. */
	contents: Array, can be null
/** Collaborators on the channel */
	collaborators: Array, can be null
}