import { Faq, Prisma } from "@prisma/client";
import { generatePaginateAndSortOptions } from "../../../helpers/paginationHelpers";
import prisma from "../../../shared/prismaClient";
import {
	IPaginationParams,
	ISortingParams,
} from "../../interfaces/paginationSorting";
import { IFaqFilterRequest } from "./faq.interface";

const createFaq = async (data: Faq): Promise<Faq> => {
	const result = await prisma.faq.create({
		data,
	});
	return result;
};

const getAllFaqs = async (
	filters: IFaqFilterRequest,
	options: IPaginationParams & ISortingParams
) => {
	const { limit, skip, page, sortBy, sortOrder } =
		generatePaginateAndSortOptions(options);
	const { searchTerm, ...filterData } = filters;

	const andConditions: Prisma.FaqWhereInput[] = [];

	if (searchTerm) {
		andConditions.push({
			OR: ["question", "answer", "category"].map((field) => ({
				[field]: {
					contains: searchTerm,
					mode: "insensitive",
				},
			})),
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

	const whereConditions: Prisma.FaqWhereInput =
		andConditions.length > 0 ? { AND: andConditions } : {};

	const [result, total] = await Promise.all([
		prisma.faq.findMany({
			where: whereConditions,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		}),
		prisma.faq.count({ where: whereConditions }),
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

const getSingleFaq = async (id: string): Promise<Faq | null> => {
	const result = await prisma.faq.findUnique({
		where: {
			id,
		},
	});
	return result;
};

const updateFaq = async (id: string, payload: Partial<Faq>): Promise<Faq> => {
	const result = await prisma.faq.update({
		where: {
			id,
		},
		data: payload,
	});
	return result;
};

const deleteFaq = async (id: string): Promise<Faq> => {
	const result = await prisma.faq.delete({
		where: {
			id,
		},
	});
	return result;
};

export const FaqService = {
	createFaq,
	getAllFaqs,
	getSingleFaq,
	updateFaq,
	deleteFaq,
};
