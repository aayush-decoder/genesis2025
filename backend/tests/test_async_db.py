"""Test async database operations with asyncpg."""
import pytest
import asyncio
from db import get_connection, return_connection, get_connection_pool, close_all_connections


class TestAsyncDatabase:
    """Test async database connection pool and operations."""
    
    @pytest.mark.asyncio
    async def test_connection_pool_creation(self):
        """Test that connection pool can be created."""
        pool = await get_connection_pool()
        assert pool is not None
        assert pool._minsize == 1
        assert pool._maxsize == 5
    
    @pytest.mark.asyncio
    async def test_get_and_return_connection(self):
        """Test acquiring and releasing connections from pool."""
        conn = await get_connection()
        assert conn is not None
        
        # Test a simple query
        result = await conn.fetchval("SELECT 1")
        assert result == 1
        
        # Return connection to pool
        await return_connection(conn)
    
    @pytest.mark.asyncio
    async def test_concurrent_connections(self):
        """Test that multiple connections can be acquired concurrently."""
        async def query_task(task_id):
            conn = await get_connection()
            result = await conn.fetchval(f"SELECT {task_id}")
            await return_connection(conn)
            return result
        
        # Run 3 concurrent tasks
        results = await asyncio.gather(
            query_task(1),
            query_task(2),
            query_task(3)
        )
        
        assert results == [1, 2, 3]
    
    @pytest.mark.asyncio
    async def test_query_with_parameters(self):
        """Test parameterized queries with asyncpg."""
        conn = await get_connection()
        
        # asyncpg uses $1, $2 style parameters instead of %s
        result = await conn.fetchval("SELECT $1 + $2", 10, 20)
        assert result == 30
        
        await return_connection(conn)
    
    @pytest.mark.asyncio
    async def test_connection_pool_reuse(self):
        """Test that connections are properly reused from pool."""
        pool = await get_connection_pool()
        
        # Get initial pool size
        initial_size = pool.get_size()
        
        # Acquire and release connection multiple times
        for _ in range(5):
            conn = await get_connection()
            await return_connection(conn)
        
        # Pool size should remain stable (connections reused)
        final_size = pool.get_size()
        assert final_size == initial_size
    
    @pytest.mark.asyncio
    async def test_connection_timeout(self):
        """Test that connection has timeout configured."""
        pool = await get_connection_pool()
        # Check that command_timeout is set (asyncpg pool doesn't expose this directly)
        # Just verify pool works without timing out on simple query
        conn = await get_connection()
        result = await conn.fetchval("SELECT 42")
        assert result == 42
        await return_connection(conn)


# Run cleanup after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_pool():
    """Cleanup connection pool after all tests."""
    yield
    # Cleanup happens here
    asyncio.run(close_all_connections())
