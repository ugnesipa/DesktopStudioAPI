const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',  // OpenAPI version
    info: {
      title: 'DesktopStudio Web API',  // Title of the API
      version: '1.0.0',   // Version of the API
      description: 'This is the API documentation for your project.',
      contact: {
        name: 'Ugne Sipaviciute',
        email: 'ugnesipaviciute01"gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',  // Change to your live server URL when deploying
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to your route files, for example, './routes/*.js' will include all the route files
};

// Generate Swagger Docs
const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerDocs, swaggerUi };
