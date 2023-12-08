export {};

declare global {
	export type UploadData = string[] | File[];

	export interface ImageUploaderComponentProps {
		id?: string;
		childId?: string;
		label?: string;
		visible?: boolean;
		selected?: boolean;
		clickHandler?: any;
		children?: React.ReactNode | React.ReactNode[];
		fcRef?: React.Ref<HTMLInputElement>;
		multifile?: boolean;
		fileData?: File[];
		formats?: string;
		disabled?: boolean;
		dispatch?: (action: UploaderAction) => void;
		state?: UploaderState | string;
		status?: string;
		error?: any;
		isPending?: boolean;
		animationEnd?: any;
	}
}
