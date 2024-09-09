
/**
 * @class BaseTypeService
 * @description Base service class for all type services
 * @exports BaseTypeService
 */
export default class BaseTypeService {
    /**
     * @constructor
     * @param {Object} model - The model object
     * @param {Object} dto - The dto object
     * @param {Object} options - The options
     * @returns {Object} The service object
     */
    constructor(model, dto, options = { orderBy: null }) {
        this.orderBy = options?.orderBy || 'created_at DESC';
        this.model = model;
        this.dto = dto;
    }

    /**
     * @method template
     * @description Returns the template for the service
     * @returns {Object} The template object
     */
    template() {
        return this.model.template();
    }

    /**
     * @method create
     * @description Creates a new record
     * @param {Object} args - The arguments object
     * @returns {Object} The created record
     */
    async findOne(options = { pk: null }) {
        return await this.model
            .throwIfNotPresent(options.pk, `${this.model.pk} is required`)
            .find()
            .where(this.model.pk, options.pk)
            .throwIfNotFound()
            .dto(this.dto)
            .executeOne();
    }

    /**
     * @method findAll
     * @description Finds all records
     * @param {Object} options - The options
     * @returns {Object} The records and metadata
     */
    async findAll(options = { page: null, limit: null }) {  
        return await this.model
            .find({ page: options.page, limit: options.limit })
            .orderBy(this.orderBy)
            .dto(this.dto)
            .meta()
            .execute();
    }
}
