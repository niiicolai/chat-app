import BaseModel from "../../src/models/base_model.js";
import { test, expect, describe } from 'vitest';

class TestModel extends BaseModel {
    constructor() {
        super({
            pk: 'uuid',
            fields: ['uuid', 'name'],
            requiredFields: ['name'],
            singularName: 'test',
            pluralName: 'tests',
            mysql_table: 'test',
            create_timestamp: 'created_at',
            update_timestamp: 'updated_at'
        });
    }
}


test('Test BaseModel', () => {
    const model = new TestModel();

    expect(model.pk).toBe('uuid');
    expect(model.fields).toEqual(['uuid', 'name']);
    expect(model.requiredFields).toEqual(['name']);
    expect(model.singularName).toBe('test');
    expect(model.pluralName).toBe('tests');
    expect(model.mysql_table).toBe('test');
    expect(model.create_timestamp).toBe('created_at');
    expect(model.update_timestamp).toBe('updated_at');
});

test('Test template() should return an empty object with the fields and values set to null', () => {
    const model = new TestModel();
    const template = model.template();

    expect(template).toEqual({ uuid: null, name: null });
});

test.each([
    { val: undefined, expected: 'uuid is required' },
    { val: null, expected: 'uuid is required' },
    { val: "", expected: 'uuid is required' },
])('Test throwIfNotPresent() should throw an error if the value is not present', ({ val, expected }) => {
    const model = new TestModel();
    const method = () => model.throwIfNotPresent(val, expected);

    expect(method).toThrow(expected);
});

test('Test count() should set an operation object on the model', () => {
    const model = new TestModel();
    model.count();

    expect(model.operation).toBeDefined();
    expect(model.operation.method).toEqual('count');
    expect(model.operation.options).toEqual({});
    expect(model.operation.conditions).toEqual({});
});

test('Test sum(options={ field: null }) should set an operation object on the model', () => {
    const model = new TestModel();
    model.sum({ field: "balance" });

    expect(model.operation).toBeDefined();
    expect(model.operation.method).toEqual('sum');
    expect(model.operation.options).toEqual({ field: "balance" });
    expect(model.operation.conditions).toEqual({});
});

test.each([
    {
        val: {},
        expected: {method: 'find', options: {}, conditions: {}}
    },
    {
        val: { page: null, limit: null },
        expected: {method: 'find', options: {}, conditions: {}}
    },
    {
        val: { page: 1 },
        expected: {method: 'find', options: {}, conditions: {}}
    },
    { 
        val: { page: 2, limit: 20 }, 
        expected: { 
            method: 'find', 
            options: { limit: 20, offset: 20 }, 
            conditions: { page: 2, limit: 20 } 
        } 
    },
])('Test find(options={$val}) should set an operation object on the model to $expected', ({ val, expected }) => {
    const model = new TestModel();
    model.find(val);

    expect(model.operation).toEqual(expected);
});

/**
 * create method
 */
describe('Test create(options={})', () => {
    test.each([
        {
            val: { body: { name: 'test' } },
            expected: {method: 'create', options: { body: { name: 'test' } }, conditions: {}}
        }
    ])('Test create(options={$val}) should return $expected', ({ val, expected }) => {
        const model = new TestModel();
        model.create(val);

        expect(model.operation).toEqual(expected);
    });

    test.each([
        { val: {}, expected: 'Body is required' },
        { val: { body: { uuid: 'test' }}, expected: 'Field name is required' },
    ])('Test create(options={$val}) should throw $expected', ({ val, expected }) => {
        const model = new TestModel();
        const method = () => model.create(val);

        expect(method).toThrow(expected);
    });
});

/**
 * Update method
 */
describe('Test update(options={})', () => {
    test.each([
        {
            val: { body: { name: 'test' } },
            expected: {method: 'update', options: { body: { name: 'test' } }, conditions: {}}
        }
    ])('Test update(options={$val}) should return $expected', ({ val, expected }) => {
        const model = new TestModel();
        model.update(val);

        expect(model.operation).toEqual(expected);
    });

    test.each([
        { val: {}, expected: 'Body is required' },
        { val: { body: { uuid: 'test' }}, expected: 'Field name is required' },
    ])('Test update(options={$val}) should throw $expected', ({ val, expected }) => {
        const model = new TestModel();
        const method = () => model.update(val);

        expect(method).toThrow(expected);
    });
});

/**
 * destroy method
 */
test('Test destroy() should set an operation object on the model', () => {
    const model = new TestModel();
    model.destroy();

    expect(model.operation).toEqual({ method: 'destroy', options: {}, conditions: {} });
});

/**
 * chaining methods
 */
describe('Test chaining methods', () => {
    test.each([
        {methodA: 'count', argsA: {}, methodB: 'sum', argsB: {field:'test'}, expected: 'model[methodA](...)[methodB] is not a function'},
        {methodA: 'count', argsA: {}, methodB: 'find', argsB: {}, expected: 'model[methodA](...)[methodB] is not a function'},
        {methodA: 'count', argsA: {}, methodB: 'create', argsB: {body: {}}, expected: 'model[methodA](...)[methodB] is not a function'},
        {methodA: 'count', argsA: {}, methodB: 'update', argsB: {body: {}}, expected: 'model[methodA](...)[methodB] is not a function'},
        {methodA: 'count', argsA: {}, methodB: 'destroy', argsB: {}, expected: 'model[methodA](...)[methodB] is not a function'},
    ])('Test $methodA($argsA).$methodB($argsB) should throw $expected', ({ methodA, argsA, methodB, argsB, expected }) => {
        const model = new TestModel();    
        const method = () => model[methodA](argsA)[methodB](argsB);
        
        expect(method).toThrow(expected);
    });

    test.each([
        {methodA: 'count', argsA: {}, methodB: 'where', argsB: {field:'test'}, expected: 'object'},
        {methodA: 'find', argsA: {}, methodB: 'where', argsB: {field:'test'}, expected: 'object'},
        {methodA: 'create', argsA: {body: {name:'test'}}, methodB: 'where', argsB: {field:'test'}, expected: 'object'},
        {methodA: 'update', argsA: {body: {name:'test'}}, methodB: 'where', argsB: {field:'test'}, expected: 'object'},
        {methodA: 'destroy', argsA: {}, methodB: 'where', argsB: {field:'test'}, expected: 'object'},
    ])('Test $methodA($argsA).$methodB($argsB) should return $expected', ({ methodA, argsA, methodB, argsB, expected }) => {
        const model = new TestModel();    
        const act = model[methodA](argsA)[methodB](argsB);
        
        expect(typeof act).toBe(expected);
    });
});

/**
 * sub methods
 */
describe('Test sub methods', () => {
    const model = new TestModel();

    test.each([
        {key: 'test', val: 'test', op: '=', expected: { where: { test: { operator: '=', value: 'test' }} }},
        {key: 'test', val: 'test', op: null, expected: { where: { test: { operator: '=', value: 'test' }} }},
        {key: 'test', val: 'test', op: undefined, expected: { where: { test: { operator: '=', value: 'test' }} }},
        {key: 'test', val: 'test', op: '!=', expected: { where: { test: { operator: '!=', value: 'test' }} }},
        {key: 'test', val: 'test', op: '>', expected: { where: { test: { operator: '>', value: 'test' }} }},
        {key: 'test', val: 'test', op: '>=', expected: { where: { test: { operator: '>=', value: 'test' }} }},
    ])('Test where($key, $val, $op) should set the sub options object to $expected', ({ key, val, op, expected }) => {
        const sub = new TestModel().find();
        const act = sub.where(key, val, op);
        
        expect(act.options).toEqual(expected);
    });

    test.each([
        {model, field: 'test', model_field: 'test', model_table: 'test', expected: [{ model, field: 'test', model_field: 'test', model_table: 'test' }]},
        {model, field: 'test', model_field: undefined, model_table: undefined, expected: [{ model, field: 'test' }]},
        {model, field: 'test', model_field: 'test', model_table: undefined, expected: [{ model, model_field: 'test', field: 'test' }]},
        {model, field: 'test', model_field: undefined, model_table: 'test', expected: [{ model, model_table: 'test', field: 'test' }]},
    ])('Test include($model, $field, $model_field, $model_table) should set the sub options object to $expected', ({ model, field, model_field, model_table, expected }) => {
        const sub = new TestModel().find();
        const act = sub.include(model, field, model_field, model_table);
         
        expect(act.options.include[0]).toEqual(expected[0]);
    });

    test.each([
        {a: 'test', expected: { orderBy: 'test' }},
    ])('Test orderBy($a) should set the sub options object to $expected', ({ a, expected }) => {
        const sub = new TestModel().find();
        const act = sub.orderBy(a);
         
        expect(act.options).toEqual(expected);
    });

    test.each([
        {a: {}, expected: { transaction: {} }},
    ])('Test transaction($a) should set the sub options object to $expected', ({ a, expected }) => {
        const sub = new TestModel().find();
        const act = sub.transaction(a);
         
        expect(act.options).toEqual(expected);
    });

    test.each([
        {a: "msg", expected: { notFound: { status: 404, message: "msg" } }},
    ])('Test throwIfNotFound($a) should set the sub conditions object to $expected', ({ a, expected }) => {
        const sub = new TestModel().find();
        const act = sub.throwIfNotFound(a);
         
        expect(act.model.operation.conditions).toEqual(expected);
    });

    test.each([
        {a: "msg", expected: { found: { status: 400, message: "msg" } }},
    ])('Test throwIfFound($a) should set the sub conditions object to $expected', ({ a, expected }) => {
        const sub = new TestModel().find();
        const act = sub.throwIfFound(a);
         
        expect(act.model.operation.conditions).toEqual(expected);
    });

    test.each([
        {a: {}, expected: { dto: {} }},
    ])('Test dto($a) should set the sub conditions object to $expected', ({ a, expected }) => {
        const sub = new TestModel().find();
        const act = sub.dto(a);
         
        expect(act.model.operation.conditions).toEqual(expected);
    });

    test.each([
        {a: {}, expected: { meta: true }},
    ])('Test meta($a) should set the sub conditions object to $expected', ({ a, expected }) => {
        const sub = new TestModel().find();
        const act = sub.meta(a);
         
        expect(act.model.operation.conditions).toEqual(expected);
    });

    test.each([
        {callback: (o) => { o.a = 'a'; o.b = 'b'; return o }, expected: { a: 'a', b: 'b' }},
    ])('Test each($callback) should let the caller iterate a method over the sub options', ({ callback, expected }) => {
        const sub = new TestModel().find();
        const act = sub.each([{}], callback);
         
        expect(act.options).toEqual(expected);
    });
});
