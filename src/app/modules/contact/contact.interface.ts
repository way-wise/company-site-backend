export type IContact = {
	fullName: string;
	email: string;
	whatsappNumber: string;
	serviceRequired: string;
	projectBudget: string;
	projectDescription: string;
};

export type IContactFilterRequest = {
	searchTerm?: string;
};
