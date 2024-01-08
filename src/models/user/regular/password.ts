import { SchemaDefinitionProperty } from "mongoose";

export interface IPassword {
  password?: string;
}

interface PasswordFields {
  password: SchemaDefinitionProperty;
}

export const passwordFields: PasswordFields = {
  password: {
    type: String,
    minLength: 7,
    trim: true,
    validate(value: string) {
      if (value.toLowerCase().includes("password"))
        throw new Error("Weak Password!!!");
    },
  },
};
