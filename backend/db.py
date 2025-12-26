import asyncpg
import asyncio
from typing import Optional

# Async connection pool for better performance in async context
_connection_pool: Optional[asyncpg.Pool] = None
_pool_lock = asyncio.Lock()

async def get_connection_pool() -> asyncpg.Pool:
    """Get or create an async connection pool."""
    global _connection_pool
    
    if _connection_pool is None:
        async with _pool_lock:
            if _connection_pool is None:  # Double-check locking
                _connection_pool = await asyncpg.create_pool(
                    host="127.0.0.1",
                    port=5433,
                    database="orderbook",
                    user="postgres",
                    password="postgres",
                    min_size=1,
                    max_size=5,
                    command_timeout=60
                )
    
    return _connection_pool

async def get_connection():
    """Get a connection from the pool."""
    pool = await get_connection_pool()
    return await pool.acquire()

async def return_connection(conn):
    """Return a connection to the pool."""
    pool = await get_connection_pool()
    await pool.release(conn)

async def close_all_connections():
    """Close all connections in the pool."""
    global _connection_pool
    if _connection_pool is not None:
        await _connection_pool.close()
        _connection_pool = None
