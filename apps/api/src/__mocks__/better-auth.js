module.exports = { betterAuth: jest.fn(() => ({ api: { getSession: jest.fn() }, handler: jest.fn() })), prismaAdapter: jest.fn(), username: jest.fn(), bearer: jest.fn(), toNodeHandler: jest.fn() };
