
/**
 * @constant manager
 * @description The manager object
 */
const manager = { };

/**
 * @function count
 * @description Count the number of records
 * @param {String} pluralName The plural name of the resource
 * @returns {Number} The number of records
 */
manager.count = async function (pluralName) {
    return 0;
}

/**
 * @function findAll
 * @description Find all records
 * @param {String} pluralName The plural name of the resource
 * @param {Number} limit The number of records to return
 * @param {Number} offset The number of records to skip
 * @returns {Array} An array of records
 */
manager.findAll = async function (pluralName, limit = 10, offset = 0) {
    return [];
}

/**
 * @function findOne
 * @description Find one record
 * @param {String} pluralName The plural name of the resource
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {object} The record
 */
manager.findOne = async function (pluralName, pk, pkValue) {
    return null;
}

/**
 * @function create
 * @description Create a record
 * @param {String} pluralName The plural name of the resource
 * @param {Object} data The data to create
 * @returns {undefined}
 */
manager.create = async function (pluralName, data) {
}

/**
 * @function update
 * @description Update a record
 * @param {String} pluralName The plural name of the resource
 * @param {Object} data The data to update
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.update = async function (pluralName, data, pk, pkValue) {
}

/**
 * @function destroy
 * @description Destroy a record
 * @param {String} pluralName The plural name of the resource
 * @param {String} pk The primary key
 * @param {String} pkValue The primary key value
 * @returns {undefined}
 */
manager.destroy = async function (pluralName, pk, pkValue) {
}

// export manager
export default manager;
