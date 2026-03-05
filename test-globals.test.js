// Teste usando globals (sem imports)
// vitest.config.js tem globals: true

describe('Teste Com Globals', () => {
    it('deve funcionar com globals', () => {
        expect(true).toBe(true);
    });
});
