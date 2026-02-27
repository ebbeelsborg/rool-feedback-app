import { describe, it, expect, vi } from "vitest";
import { createIssue, type Space } from "./rool";

// Mock the Rool client and SDK
vi.mock("@rool-dev/sdk", () => {
  const mockClient = {
    getCurrentUser: vi.fn(),
    getAuthUser: vi.fn(),
  };
  mockClient.getCurrentUser.mockResolvedValue({ name: "Test User", id: "user-123" });
  mockClient.getAuthUser.mockReturnValue({ name: "Test User" });

  return {
    RoolClient: vi.fn().mockImplementation(function () {
      return mockClient;
    }),
  };
});

describe("createIssue", () => {
  it("should create an issue with the correct JSON structure", async () => {
    // Mock space
    const mockSpace = {
      userId: "user-123",
      createObject: vi.fn().mockResolvedValue({ id: "issue-456" }),
      findObjects: vi.fn().mockResolvedValue({ objects: [] }),
    } as unknown as NonNullable<Space>;

    const issueData = {
      title: "Test Bug",
      content: "This is a test bug report",
      category: "Bug",
      isBug: true,
      attachments: ["https://example.com/image.png"],
    };

    const result = await createIssue(mockSpace, issueData);

    expect(result.success).toBe(true);

    // Assert on the JSON structure passed to createObject
    const callArguments = vi.mocked(mockSpace.createObject).mock.calls[0][0];
    const payload = callArguments.data;

    expect(payload).toMatchObject({
      type: "Issue",
      title: "Test Bug",
      content: "This is a test bug report",
      category: "Bug",
      createdBy: "user-123",
      isBug: true,
      attachments: ["https://example.com/image.png"],
    });

    // Check that numeric fields like createdAt exist
    expect(typeof payload.createdAt).toBe("number");
    expect(typeof payload.issueNumber).toBe("number");
    expect(payload.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.createdByName).toBe("Test User");
  });
});
