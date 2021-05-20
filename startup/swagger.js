const swaggerUi = require("swagger-ui-express");
const config = require("config");

const swaggerDocument = {
  swagger: "2.0",
  info: {
    version: "1.0.0", //version of the OpenAPI Specification
    title: "MLS Security API",
    description: "MLS Security Web API",
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  host: `${config.get("host")}:${config.get("port")}`,
  basePath: "/api",
  tags: [
    {
      name: "Users",
      description: "API for users in the system",
    },
  ],
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  paths: {
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users in system",
        responses: {
          200: {
            description: "OK",
            schema: {
              $ref: "#/definitions/Users",
            },
          },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Creates a new user",
        parameters: [
          {
            name: "user",
            in: "body",
            description: "User that we want to create",
            schema: {
              $ref: "#/definitions/User",
            },
          },
        ],
        produces: ["application/json"],
        responses: {
          201: {
            description: "Created",
            schema: {
              $ref: "#/definitions/User",
            },
          },
        },
      },
    },
  },
  definitions: {
    User: {
      required: [
        "name",
        "contact.phoneNumber",
        "gender",
        "email",
        "nextOfKin.contact.phoneNumber",
      ],
      properties: {
        _id: {
          type: "string",
          uniqueItems: true,
          description:
            "A unique identifier for user. Automatically assigned by the API when the movie is created",
        },
        name: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            middleName: { type: "string" },
          },
        },
        gender: { type: "string" },
        email: { type: "string", uniqueItems: true },
        contact: {
          type: "object",
          properties: {
            address: {
              type: "object",
              properties: {
                line1: { type: "string" },
                line2: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                country: { type: "string" },
                postCode: { type: "string" },
              },
            },
            phoneNumber: { type: "string", required: true },
          },
        },
        nextOfKin: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            relationship: { type: "string" },
            contact: {
              type: "object",
              properties: {
                address: {
                  type: "object",
                  properties: {
                    line1: { type: "string" },
                    line2: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    country: { type: "string" },
                    postCode: { type: "string" },
                  },
                },
                phoneNumber: { type: "string", required: true },
              },
            },
          },
        },
      },
    },
    Users: {
      type: "array",
      $ref: "#/definitions/User",
    },
  },
};

module.exports = function (app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
