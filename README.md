# Syed's Gift Shop - Online Store Web application
Full-stack web application for an online store based on the idea of eCommerce. Customers can order products by filling up a web form. They get a receipt and can also submit a request along with a photo. The informations are validated on the server side and also stored in a NoSQL database. Admin panel requires log in and allows owner to view/edit/delete the requests and view all the receipts. 
- Developed the font-end with HTML5, CSS3, jQuery and server-side programming with Javascript which was rendered to the client-side using EJS.
- Utilized Node.js and Express.js framework build the back-end with NoSQL database MongoDb.
- Express-validator was used for user input validation on the server-side.

![Onloine Store](https://user-images.githubusercontent.com/55814513/189981151-4bc773da-1ea9-48df-a57a-f1ef52fade63.png)
## How To Run
### Prerequisites
- Requires [NodeJS](https://nodejs.org/en/download/) and [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) 
- Requires [MongoDB](https://www.mongodb.com/try/download/community) and [MongoDB Compass](https://www.mongodb.com/products/compass) 
- Download the repository as zip and extract or clone it to your local device
### Steps for Cloning the source code
Run the following command in terminal one by one
```sh
$ git clone https://github.com/SyedAhmedCU/online_store.git
```
```sh
$ cd online_store
```
### Install packages and dependencies of node modules
```sh
$ npm install
```
### Start server
```sh
$ node index.js
```
If the nodemon model is installed
```sh
$ npm run dev
``` 
### Open in Browser
Go to http://localhost:8080/ from the browser when the server is up and running

## License
Copyright 2022 Syed Tasnim Ahmed
Licensed under the GPLv3: http://www.gnu.org/licenses/gpl-3.0.html
### Why GPLv3?
GPL license refers to the GNU’s General Public License version 3 which is widely used to prevent software from becoming proprietary. A particular user can freely use, modify, or redistribute software without any restrictions which is what I want for this project. 
