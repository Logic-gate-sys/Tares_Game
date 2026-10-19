import { describe, test, vi, beforeEach} from 'vitest'; 
import {createUser, getUserWithDetail } from '#repositories/users'

vi.mock('#repositories/users', () => ({
  select: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
}))



describe("User Utility Functionalites", () => {
  beforeEach(() => {
    vi.clearAllMocks(); 
    vi.mock(create)
  })
})