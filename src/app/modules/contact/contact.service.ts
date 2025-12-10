import prisma from "../../../shared/prismaClient";
import { IContact, IContactFilterRequest } from "./contact.interface";
import { Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import {
	IPaginationParams,
	ISortingParams,
} from "../../interfaces/paginationSorting";

const createContact = async (payload: IContact) => {
	const result = await prisma.contact.create({
		data: payload,
	});
	return result;
};

const getAllContacts = async (
	filters: IContactFilterRequest,
	options: IPaginationParams & ISortingParams
) => {
	const { limit, skip, page, sortBy, sortOrder } =
		generatePaginateAndSortOptions(options);
	const { searchTerm, ...filterData } = filters;

	const andConditions: Prisma.ContactWhereInput[] = [];

	if (searchTerm) {
		andConditions.push({
			OR: ["fullName", "email", "whatsappNumber", "serviceRequired"].map(
				(field) => ({
					[field]: {
						contains: searchTerm,
						mode: "insensitive",
					},
				})
			),
		});
	}

	if (Object.keys(filterData).length > 0) {
		andConditions.push({
			AND: Object.keys(filterData).map((key) => ({
				[key]: {
					equals: (filterData as any)[key],
				},
			})),
		});
	}

	const whereConditions: Prisma.ContactWhereInput =
		andConditions.length > 0 ? { AND: andConditions } : {};

	const [result, total] = await Promise.all([
		prisma.contact.findMany({
			where: whereConditions,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.contact.count({ where: whereConditions }),
	]);

	return {
		meta: {
			total,
			page,
			limit,
		},
		data: result,
	};
};

export const ContactService = {
	createContact,
	getAllContacts,
};
