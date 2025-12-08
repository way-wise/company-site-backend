import prisma from "../../../shared/prismaClient";
import { IContact } from "./contact.interface";

const createContact = async (payload: IContact) => {
	const result = await prisma.contact.create({
		data: payload,
	});
	return result;
};

export const ContactService = {
	createContact,
};
