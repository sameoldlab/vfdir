export type ChannelStatus = "private" | "closed" | "public";
export type ChannelFlags = "published" | "collaboration" | "default" | "profile";

export type Block = {
	id: number;
	title: string;
	filename?: string;
	description: string;
	type: string;
	content?: string;
	image?: string;
	created_at: string;
	updated_at: string;
	source: string;
	author_id: string;
	arena_id: number;
};

export type Channel = {
	slug: string;
	title: string;
	updated: Date;
	created_at: Date;
	status: ChannelStatus;
	author_slug: string;
	flags: ChannelFlags[];
	blocks: Block[];
};
