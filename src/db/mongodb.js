
/**
 * @constant manager
 * @description The manager object
 */
const manager = { };

/**
 * @function count
 * @description Count the number of records
 * @param {String} model The model
 * @returns {Number} The number of records
 */
manager.count = async function (model) {
    return 0;
}

/**
 * @function findAll
 * @description Find all records
 * @param {String} model The model
 * @param {Number} limit The number of records to return
 * @param {Number} offset The number of records to skip
 * @returns {Array} An array of records
 */
manager.findAll = async function (model, limit = 10, offset = 0) {
    return [];
}

/**
 * @function findOne
 * @description Find one record
 * @param {String} model The model
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {object} The record
 */
manager.findOne = async function (model, pk, pkValue) {
    return null;
}

/**
 * @function create
 * @description Create a record
 * @param {String} model The model
 * @param {Object} data The data to create
 * @returns {undefined}
 */
manager.create = async function (model, data) {
}

/**
 * @function update
 * @description Update a record
 * @param {String} model The model
 * @param {Object} data The data to update
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.update = async function (model, data, pk, pkValue) {
}

/**
 * @function destroy
 * @description Destroy a record
 * @param {String} model The model
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.destroy = async function (model, pk, pkValue) {
}

// export manager
export default manager;
