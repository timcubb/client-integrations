import { EvolvGAClient } from "../index";

test('Validate everything works if GA is already loaded', async () => {
    window.ga = jest.fn();
    const client = new EvolvGAClient('trackingId', 'ns', 'candidateId', 'userId');

    expect(window.ga).not.toHaveBeenCalled();
});
