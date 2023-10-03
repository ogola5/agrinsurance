import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Order = Record<{
    id: string;
    consumerId: string;
    farmerId: string;
    typeOfGood: string;
    amount: nat64;
    payment: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>;

type OrderPayload = Record<{
    consumerId: string;
    farmerId: string;
    typeOfGood: string;
    amount: nat64;
    payment: string;
}>;

const orderStorage = new StableBTreeMap<string, Order>(0, 44, 1024);

$query;
export function getOrders(): Result<Vec<Order>, string> {
    return Result.Ok(orderStorage.values());
}

$query;
export function getOrder(id: string): Result<Order, string> {
    return match(orderStorage.get(id), {
        Some: (order) => Result.Ok<Order, string>(order),
        None: () => Result.Err<Order, string>(`an order with id=${id} not found`)
    });
}

$update;
export function createOrder(payload: OrderPayload): Result<Order, string> {
    const order: Order = {
        id: uuidv4(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        ...payload,
    };
    orderStorage.insert(order.id, order);
    return Result.Ok(order);
}

$update;
export function updateOrder(id: string, payload: OrderPayload): Result<Order, string> {
    return match(orderStorage.get(id), {
        Some: (order) => {
            const updatedOrder: Order = { ...order, ...payload, updatedAt: Opt.Some(ic.time()) };
            orderStorage.insert(order.id, updatedOrder);
            return Result.Ok<Order, string>(updatedOrder);
        },
        None: () => Result.Err<Order, string>(`couldn't update an order with id=${id}. order not found`)
    });
}

$update;
export function deleteOrder(id: string): Result<Order, string> {
    return match(orderStorage.remove(id), {
        Some: (deletedOrder) => Result.Ok<Order, string>(deletedOrder),
        None: () => Result.Err<Order, string>(`couldn't delete an order with id=${id}. order not found.`)
    });
}

// A workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
}
