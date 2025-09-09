export interface StorageBackend {
  /**
   * Store data and return a unique identifier for retrieval
   * @param id - Unique identifier for the data
   * @param data - The data to store as a Buffer
   * @returns Promise<string> - Unique path/key for retrieving the data
   */
  store(id: string, data: Buffer): Promise<string>;

  /**
   * Retrieve data using the path/key returned from store()
   * @param path - The path/key returned from store()
   * @returns Promise<Buffer> - The stored data
   */
  retrieve(path: string): Promise<Buffer>;

  /**
   * Delete data using the path/key
   * @param path - The path/key to delete
   * @returns Promise<void>
   */
  delete(path: string): Promise<void>;

  /**
   * Get the name of this storage backend
   * @returns string - The name of the storage backend
   */
  getName(): string;
}
