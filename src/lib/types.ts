export interface FileEntry {
	name: string;
	path: string;
	type: 'file' | 'directory';
	children?: FileEntry[];
}
