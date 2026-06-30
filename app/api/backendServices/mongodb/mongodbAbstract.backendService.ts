import mongoose, { Connection, Model, Schema } from "mongoose";

export interface MongoDocument {
  _id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

abstract class MongoDBAbstractService {
  protected conn: Connection | null = null;
  protected models: Record<string, Model<any>> = {};

  protected abstract getUri(): string;

  protected get isConnected(): boolean {
    return this.conn !== null && this.conn.readyState === 1;
  }

  protected async connect(): Promise<Connection> {
    if (this.isConnected && this.conn) {
      return this.conn;
    }

    const uri = this.getUri();

    if (!uri) {
      throw new Error("MongoDB URI is not defined");
    }

    // Check for cached connection
    const globalWithMongoose = global as typeof globalThis & {
      mongoose: {
        conn: Connection | null;
        promise: Promise<Connection> | null;
      };
    };

    if (!globalWithMongoose.mongoose) {
      globalWithMongoose.mongoose = { conn: null, promise: null };
    }

    if (globalWithMongoose.mongoose.conn) {
      this.conn = globalWithMongoose.mongoose.conn;
      return this.conn;
    }

    if (!globalWithMongoose.mongoose.promise) {
      globalWithMongoose.mongoose.promise = mongoose
        .createConnection(uri)
        .asPromise();
    }

    this.conn = await globalWithMongoose.mongoose.promise;
    globalWithMongoose.mongoose.conn = this.conn;

    return this.conn;
  }

  protected getOrCreateModel<T>(name: string, schema: Schema<T>): Model<T> {
    if (!this.conn) {
      throw new Error("Database connection not established");
    }

    return this.conn.models[name] || this.conn.model<T>(name, schema);
  }

  protected getModel<T = any>(name: string): Model<T> {
    if (!this.models[name]) {
      throw new Error(`Model ${name} not registered`);
    }
    return this.models[name];
  }

  // Generic CRUD methods
  public async create<T>(model: Model<T>, data: Partial<T>): Promise<T> {
    const document = new model(data);
    const saved = await document.save();
    return saved.toObject() as T;
  }

  public async getById<T>(model: Model<T>, id: string): Promise<T | null> {
    return (await model.findById(id).lean()) as T | null;
  }

  public async getAll<T>(
    model: Model<T>,
    query = {},
    options: { limit?: number; skip?: number; sort?: any } = {}
  ): Promise<T[]> {
    let queryBuilder = model.find(query);

    if (options.sort) {
      queryBuilder = queryBuilder.sort(options.sort);
    }

    if (options.skip) {
      queryBuilder = queryBuilder.skip(options.skip);
    }

    if (options.limit) {
      queryBuilder = queryBuilder.limit(options.limit);
    }

    return (await queryBuilder.lean()) as T[];
  }

  public async update<T>(
    model: Model<T>,
    id: string,
    data: Partial<T>
  ): Promise<T | null> {
    return (await model
      .findByIdAndUpdate(id, data, { new: true })
      .lean()) as T | null;
  }

  public async delete<T>(model: Model<T>, id: string): Promise<boolean> {
    const result = await model.findByIdAndDelete(id);
    return result !== null;
  }

  public async count<T>(model: Model<T>, query = {}): Promise<number> {
    return await model.countDocuments(query);
  }
}

export default MongoDBAbstractService;
