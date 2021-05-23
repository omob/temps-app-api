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
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "OK",
            schema: {
              type: "array",
              items: {
                properties: {
                  name: {
                    type: "object",
                    properties: {
                      firstName: { type: "string" },
                      middleName: { type: "string" },
                      lastName: { type: "string" },
                    },
                  },
                  isDeleted: { type: "boolean" },
                  status: { type: "string", enum: ["verified", "unverified"] },
                  _id: { type: "string" },
                  role: { type: "string", enum: ["admin", "employee"] },
                },
              },
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
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Gets my profile",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "My auth token",
            schema: {
              type: "string",
            },
          },
        ],
        responses: {
          200: {
            description: "OK",
            schema: {
              $ref: "#/definitions/Response",
            },
          },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Updates my profile",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "My auth token",
            schema: {
              type: "string",
            },
          },
          {
            name: "user profile",
            in: "body",
            description: "data to be updated",
            schema: {
              $ref: "#/definitions/UserUpdate",
            },
          },
        ],

        produces: ["application/json"],
        responses: {
          200: {
            description: "OK",
            schema: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    "/users/register": {
      post: {
        tags: ["Users"],
        summary: "Admin registering a new user",
      },
      parameters: [
        {
          name: "user",
          in: "body",
          description: "User details that admin wants to create",
          schema: {
            $ref: "#/definitions/UserAdmin",
          },
        },
        {
          name: "x-auth-token",
          in: "headers",
          description: "Admin auth token",
          schema: {
            type: "string",
          },
        },
      ],
      produces: ["application/json"],
      responses: {
        201: {
          description: "Created",
          schema: {
            $ref: "#/definitions/UserAdmin",
          },
        },
      },
    },
    "/auth": {
      post: {
        tags: ["Users"],
        summary: "Logs in a user",
        parameters: [
          {
            name: "user login details",
            in: "body",
            description: "User that wants to log in",
            schema: {
              $ref: "#/definitions/Login",
            },
          },
        ],
        produces: ["application/json"],
        responses: {
          200: {
            description: "Success",
            schema: {
              type: "string",
            },
          },
          400: {
            description: "Bad Request",
            schema: {
              type: "string",
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
        "contact",
        "contact.phoneNumber",
        "gender",
        "email",
        "nextOfKin.contact.phoneNumber",
        "password",
      ],
      properties: {
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
        password: { type: "string", required: true },
      },
    },
    UserAdmin: {
      required: [
        "name",
        "contact",
        "contact.phoneNumber",
        "gender",
        "email",
        "nextOfKin.contact.phoneNumber",
        "password",
      ],
      properties: {
        name: {
          type: "object",
          properties: {
            firstName: { type: "string", example: "admin" },
            lastName: { type: "string", example: "admin" },
            middleName: { type: "string", example: "admin" },
          },
        },
        gender: { type: "string", example: "male" },
        email: {
          type: "string",
          uniqueItems: true,
          example: "administrator@email.com",
        },
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
        password: { type: "string", required: true },
        role: { type: "string", enum: ["admin", ""] },
      },
    },
    Users: {
      type: "array",
      $ref: "#/definitions/User",
    },
    UserProfile: {
      properties: {
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
    UserUpdate: {
      properties: {
        name: {
          type: "object",
          properties: {
            firstName: { type: "string" },
            lastName: { type: "string" },
            middleName: { type: "string" },
          },
        },
        gender: { type: "string" },
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
    Login: {
      required: ["email", "password"],
      properties: {
        email: { type: "string", example: "james@email.com" },
        password: { type: "string", example: "111111" },
      },
    },
    Response: {
      properties: {
        data: { type: "object", $ref: "#/definitions/UserProfile" },
        message: { type: "string" },
      },
    },
  },
};

module.exports = function (app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
