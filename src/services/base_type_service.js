export default class BaseTypeService {
    constructor(model, dto) {
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne({ pk }) {
        return await this.model
            .throwIfNotPresent(pk, 'name is required')
            .find()
            .where(this.model.pk, pk)
            .throwIfNotFound()
            .dto(this.dto)
            .executeOne();
    }

    async findAll({ page, limit }) {  
        return await this.model
            .find({ page, limit })
            .orderBy('created_at DESC')
            .dto(this.dto)
            .meta()
            .execute();
    }
}
