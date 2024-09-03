# Install
```bash
npm install
cp .env.example .env
```

# Run
```bash
npm start
```

# Test
```bash
npm test
```

# API Docs
http://localhost:3000/api-docs


# Controllers Explanation
The application implements a couple of reusable controllers to avoid code duplication and to ensure consistency across the application. The controllers are divided into three categories: base controller, type resource controller, and user resource controller. Note: All controllers are extendable and can be customised to suit the needs of the application.

## Base Controller
The base controller is the parent class of all controllers in the application. It contains common methods and properties that are shared by all controllers.

### Usage
```js
// Create controller
const ctrl = new BaseController({ crudService, auth: { index: true } });
// Define routes
ctrl.index();
```

### Add additional middleware
```js
const middleware = (req, res, next) => {
  // Do something
  next();
};
// Create controller
const ctrl = new BaseController({ crudService, auth: { index: true } });
// Define routes and insert the additional middleware
ctrl.index(middleware);
```

### Add custom routes
```js
const ctrl = new BaseController({ crudService, auth: { index: true } });
// Define custom route
const useAuthForCustomRoute = false;
const routeMethod = 'get';
const routePath = 'custom';
ctrl.defineCustomRoute(routeMethod, routePath, async (req, res) => {
    res.json({ message: 'Custom route' });
}, useAuthForCustomRoute);
// The custom route includes the base url (eg. /api/v1),
// so the full path is /api/v1/custom
```

## Type Resource Controller
The type resource controller extends the base controller and automatically calls the appropriate routes used for all resources used as predefined types. For example, 'room category'. More specifically, it creates the following routes: index, show; without requiring authorisation.

### Usage
```js
// Create controller
const ctrl = new TypeResourceController({ crudService });
// No need to call route methods
// The class automatically calls the appropriate routes.
```

## User Resource Controller
The user resource controller extends the base controller and automatically calls the appropriate routes used for all resources where identification of ownership is required. For example, 'channel message'. More specifically, it creates the following routes: index, show, store, update, destroy; requiring authorisation and template without requiring authorisation. It also ensures the authorized user is passed to the service methods.

### Usage
```js
// Create controller
const ctrl = new UserResourceController({ crudService });
// No need to call route methods
// The class automatically calls the appropriate routes.
```
