const swaggerUi = require("swagger-ui-express");

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
  host: (process.env.PRODUCTION) ? process.env.HOST :  `${process.env.HOST}:${process.env.PORT}`,
  basePath: "/api",
  tags: [
    {
      name: "Users",
      description: "API for users in the system",
    },
    {
      name: "Contracts",
      description: "API for clients / contracts in the system",
    },
    {
      name: "Shifts",
      description: "API for managing Shifts",
    },
    {
      name: "Auth",
      description: "API for Authentication",
    },
  ],
  schemes: ["http", "https"],
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
    "/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user details based on user id",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            type: "string",
            required: true,
          },
          {
            name: "id",
            in: "path",
            description: "user ID",
            type: "string",
            required: true,
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
        summary: "Updates User profile",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            type: "string",
            required: true,
          },
          {
            name: "id",
            in: "path",
            description: "user ID",
            type: "string",
            required: true,
          },
          {
            name: "user profile",
            in: "body",
            description: "data to be updated",
            schema: {
              $ref: "#/definitions/UserUpdate",
              type: "object",
              properties: {
                canLogin: { type: "boolean" },
              },
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
            in: "header",
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
              properties: {
                data: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    name: {
                      type: "object",
                      properties: {
                        firstName: { type: "string" },
                        middleName: { type: "string" },
                        lastName: { type: "string" },
                      },
                    },
                    email: { type: "string" },
                    role: { type: "string" },
                  },
                },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
    "/auth": {
      post: {
        tags: ["Auth"],
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

    "/contracts/{id}": {
      get: {
        tags: ["Contracts"],
        summary: "Get specific contract in system",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            type: "string",
            required: true,
          },
          {
            name: "id",
            in: "path",
            description: "contract ID",
            type: "string",
            required: true,
          },
        ],
        responses: {
          200: {
            description: "OK",
            schema: {
              $ref: "#/definitions/ContractReadDto",
            },
          },
        },
      },
      put: {
        tags: ["Contracts"],
        summary: "Updates a contract profile",
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
            name: "contract profile",
            in: "body",
            description: "data to be updated",
            schema: {
              $ref: "#/definitions/ContractUpdateDto",
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
    "/contracts": {
      get: {
        tags: ["Contracts"],
        summary: "Get all contracts in system",
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
              $ref: "#/definitions/ContractReadDto",
            },
          },
        },
      },
      post: {
        tags: ["Contracts"],
        summary: "Creates a new contract",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            schema: {
              type: "string",
            },
          },
          {
            name: "contract",
            in: "body",
            description: "Contract profile to be created",
            schema: {
              $ref: "#/definitions/ContractCreateDto",
            },
          },
        ],
        produces: ["application/json"],
        responses: {
          201: {
            description: "Created",
            schema: {
              $ref: "#/definitions/ContractReadDto",
            },
          },
        },
      },
    },

    "/main/dashboard": {
      get: {
        tags: ["Main"],
        summary: "Get dasbboard information",
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
              type: "object",
              properties: {
                data: {
                  type: "object",
                  properties: {
                    employeeCount: { type: "number" },
                    contractCount: { type: "number" },
                    activities: {
                      type: "object",
                    },
                  },
                },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },

    "/shifts/{id}": {
      get: {
        tags: ["Shifts"],
        summary: "Get specific shift detail",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            type: "string",
            required: true,
          },
          {
            name: "id",
            in: "path",
            description: "shift ID",
            type: "string",
            required: true,
          },
        ],
        produces: ["application/json"],
        responses: {
          200: {
            description: "OK",
            schema: {
              $ref: "#/definitions/ShiftReadDto",
            },
          },
        },
      },
      put: {
        tags: ["Shifts"],
        summary: "Updates Shift profile",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            type: "string",
            required: true,
          },
          {
            name: "id",
            in: "path",
            description: "user ID",
            type: "string",
            required: true,
          },
          {
            name: "shift profile",
            in: "body",
            description: "data to be updated",
            schema: {
              $ref: "#/definitions/ShiftUpdateDto",
              type: "object",
              properties: {
                canLogin: { type: "boolean" },
              },
            },
          },
        ],

        produces: ["application/json"],
        responses: {
          200: {
            description: "OK",
            schema: {
              $ref: "#/definitions/ShiftReadDto",
            },
          },
        },
      },
    },
    "/shifts": {
      get: {
        tags: ["Shifts"],
        summary: "Get all shifts",
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
                $ref: "#/definitions/ShiftReadDto",
              },
            },
          },
        },
      },
      post: {
        tags: ["Shifts"],
        summary: "Creates a new shift",
        parameters: [
          {
            name: "x-auth-token",
            in: "header",
            description: "Admin auth token",
            schema: {
              type: "string",
            },
          },
          {
            name: "shift",
            in: "body",
            description: "Shift that we want to create",
            schema: {
              $ref: "#/definitions/ShiftCreateDto",
            },
          },
        ],
        produces: ["application/json"],
        responses: {
          201: {
            description: "Created",
            schema: {
              $ref: "#/definitions/ShiftReadtDto",
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
    ContractCreateDto: {
      required: ["name", "productions"],
      properties: {
        name: { type: "string" },
        email: { type: "string", unique: true },
        contactNumber: { type: "string" },
        address: {
          type: "object",
          properties: {
            line1: { type: "string" },
            line2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            country: { type: "string" },
            postCode: { type: "string", required: true },
          },
        },
        inRate: { type: "number" },
        productions: {
          type: "array",
          items: {
            properties: {
              name: { type: "string" },
              licenses: { type: "array", items: { type: "string" } },
              locations: {
                type: "array",
                items: {
                  properties: {
                    name: { type: "string" },
                    address: {
                      type: "object",
                      properties: {
                        line1: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string" },
                        postCode: { type: "string", required: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    ContractReadDto: {
      properties: {
        _id: { type: "string" },
        name: { type: "string" },
        email: { type: "string", unique: true },
        contactNumber: { type: "string" },
        address: {
          type: "object",
          properties: {
            line1: { type: "string" },
            line2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            country: { type: "string" },
            postCode: { type: "string", required: true },
          },
        },
        inRate: { type: "number" },
        productions: {
          type: "array",
          items: {
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              licenses: { type: "array", items: { type: "string" } },
              locations: {
                type: "array",
                items: {
                  properties: {
                    _id: { type: "string" },
                    name: { type: "string" },
                    address: {
                      type: "object",
                      properties: {
                        line1: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string" },
                        postCode: { type: "string", required: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    ContractUpdateDto: {
      required: ["name", "email", "productions.name", "productions._id"],
      properties: {
        name: { type: "string" },
        businessType: { type: "string" },
        email: { type: "string", unique: true },
        contactNumber: { type: "string" },
        address: {
          type: "object",
          properties: {
            line1: { type: "string" },
            line2: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            country: { type: "string" },
            postCode: { type: "string", required: true },
          },
        },
        inRate: { type: "number" },
        productions: {
          type: "array",
          items: {
            properties: {
              name: { type: "string", required: true },
              _id: { type: "string", required: true },
              licenses: { type: "array", items: { type: "string" } },
              locations: {
                type: "array",
                items: {
                  properties: {
                    name: { type: "string" },
                    _id: { type: "string" },
                    address: {
                      type: "object",
                      properties: {
                        line1: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string" },
                        postCode: { type: "string", required: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    ShiftReadDto: {
      properties: {
        _id: { type: "string" },
        employee: {
          type: "object",
          properties: {
            name: {
              type: "object",
              properties: {
                firstName: { type: "string" },
                lastName: { type: "string" },
                middleName: { type: "string" },
              },
            },
            _id: { type: "string" },
          },
        },
        contractInfo: {
          type: "object",
          properties: {
            contract: {
              type: "object",
              properties: { _id: { type: "string" }, name: { type: "string" } },
            },
            production: {
              type: "object",
              properties: { _id: { type: "string" }, name: { type: "string" } },
            },
            location: {
              type: "object",
              properties: {
                _id: { type: "string" },
                address: {
                  type: "object",
                  properties: {
                    line1: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    country: { type: "string" },
                    postCode: { type: "string" },
                  },
                },
              },
            },
          },
        },
        status: {
          type: "string",
          enum: [
            "PENDING",
            "ACCEPTED",
            "REJECTED",
            "OUTDATED",
            "ONGOING",
            "COMPLETED",
          ],
        },
        date: { type: "date" },
        time: {
          type: "object",
          properties: {
            start: { type: "string" },
            end: { type: "string" },
            break: { type: "string" },
          },
        },
        milleage: { type: "string" },
        meal: { type: "string" },
        notes: { type: "string" },
      },
    },
    ShiftCreateDto: {
      properties: {
        employee: { type: "string" },
        contract: {
          type: "object",
          properties: {
            id: { type: "string" },
            production: {
              type: "object",
              properties: {
                id: { type: "string" },
                location: { type: "string" },
              },
            },
            outRate: { type: "string" },
            position: { type: "string" },
          },
        },
        employees: { type: "array", items: { type: "string" } },
        dates: { type: "array", items: { type: "dates" } },
        time: {
          type: "object",
          properties: {
            start: { type: "string" },
            end: { type: "string" },
            break: { type: "string" },
          },
        },
        milleage: { type: "string" },
        meal: { type: "string" },
        notes: { type: "string" },
        status: {
          type: "string",
          enum: [
            "PENDING",
            "ACCEPTED",
            "REJECTED",
            "OUTDATED",
            "ONGOING",
            "COMPLETED",
          ],
        },
      },
    },
    ShiftUpdateDto: {
      properties: {
        contract: {
          type: "object",
          properties: {
            id: { type: "string" },
            production: {
              type: "object",
              properties: {
                id: { type: "string" },
                location: { type: "string" },
              },
            },
            outRate: { type: "string" },
            position: { type: "string" },
          },
        },
        employee: { type: "string" },
        date: { type: "string" },
        time: {
          type: "object",
          properties: {
            start: { type: "string" },
            end: { type: "string" },
            break: { type: "string" },
          },
        },
        milleage: { type: "string" },
        meal: { type: "string" },
        notes: { type: "string" },
      },
    },
  },
};

module.exports = function (app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
