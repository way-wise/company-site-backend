import { Request, Response } from "express";
import httpStatus from "http-status";
import { uploadFileToBlob } from "../../../helpers/blobUploader";
import { paginationAndSortingParams } from "../../../shared/appConstants";
import catchAsync from "../../../shared/catchAsync";
import { filterValidQueryParams } from "../../../shared/filterValidQueryParams";
import { sendResponse } from "../../../shared/sendResponse";
import { UploadedFile } from "../../interfaces/file";
import { validParams } from "./partner.constants";
import { PartnerService } from "./partner.service";

const createPartner = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    let imageUrl = req.body.image;

    // If file is uploaded, upload to blob storage
    if (req.file) {
      const uploadResult = await uploadFileToBlob(req.file as unknown as UploadedFile, {
        prefix: "partners",
      });
      imageUrl = uploadResult.url;
    }

    if (!imageUrl) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Image is required",
        data: null,
      });
    }

    const result = await PartnerService.createPartnerIntoDB({
      name: req.body.name,
      image: imageUrl,
      isShow: req.body.isShow === "true" || req.body.isShow === true,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Partner created successfully!",
      data: result,
    });
  }
);

const getAllPartner = catchAsync(async (req: Request, res: Response) => {
  const validQueryParams = filterValidQueryParams(req.query, validParams);
  const paginationAndSortingQueryParams = filterValidQueryParams(
    req.query,
    paginationAndSortingParams
  );

  const result = await PartnerService.getAllPartnerFromDB(
    validQueryParams,
    paginationAndSortingQueryParams
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner data fetched!",
    data: result,
  });
});

const getPublicPartners = catchAsync(async (req: Request, res: Response) => {
  const result = await PartnerService.getPublicPartnersFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Public partners fetched successfully!",
    data: result,
  });
});

const getSinglePartner = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await PartnerService.getSinglePartnerFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner data fetched successfully!",
    data: result,
  });
});

const updatePartner = catchAsync(
  async (req: Request & { file?: Express.Multer.File }, res: Response) => {
    const { id } = req.params;
    const updateData: { name?: string; image?: string; isShow?: boolean } = {};

    if (req.body.name) {
      updateData.name = req.body.name;
    }

    if (req.body.isShow !== undefined) {
      updateData.isShow =
        req.body.isShow === "true" || req.body.isShow === true;
    }

    // If file is uploaded, upload to blob storage
    if (req.file) {
      const uploadResult = await uploadFileToBlob(req.file as unknown as UploadedFile, {
        prefix: "partners",
      });
      updateData.image = uploadResult.url;
    } else if (req.body.image) {
      updateData.image = req.body.image;
    }

  const result = await PartnerService.updatePartnerIntoDB(id, updateData);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner data updated successfully!",
    data: result,
  });
  }
);

const togglePartnerIsShow = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isShow } = req.body;

  const result = await PartnerService.togglePartnerIsShow(
    id,
    isShow === "true" || isShow === true
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner visibility toggled successfully!",
    data: result,
  });
});

const deletePartner = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await PartnerService.deletePartnerFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Partner data deleted successfully!",
    data: result,
  });
});

export const PartnerController = {
  createPartner,
  getAllPartner,
  getPublicPartners,
  getSinglePartner,
  updatePartner,
  togglePartnerIsShow,
  deletePartner,
};

