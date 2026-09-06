export type Configuration = {
	type: "string" | "number" | "boolean";
	default: string | number | boolean | null;
	unit?: string;
	effect: string;
	required: boolean;
	secret?: boolean;
	constraints?: string;
	source?: string;
	applies?: string;
};

export type Description = (string | { config: string })[];

export type WorkerContract = {
	name: string;
	purpose: string;
	configurationSource: string;
	configurationApplies: string;
	configuration: Record<string, Configuration>;
	processes: {
		name: string;
		trigger: Description;
		description: Description;
	}[];
};
