import data from '../../../seed_data.js';

export default class UserLoginTypeSeeder {
    order() {
        return 0;
    }
    
    async up(neodeInstance) {
        await Promise.all(data.user_login_types.map(async (state) => {
            return neodeInstance.model('UserLoginType').create({
                name: state.name,
            });
        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:UserLoginType) DETACH DELETE n');
    }
}
