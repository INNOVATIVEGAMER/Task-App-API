import { SchemaDefinitionProperty } from "mongoose";

export interface IGoogle {
  google: Boolean;
}

interface GoogleFields {
  google: SchemaDefinitionProperty;
}

export const googleFields: GoogleFields = {
  google: {
    type: Boolean,
    default: false,
  },
};
