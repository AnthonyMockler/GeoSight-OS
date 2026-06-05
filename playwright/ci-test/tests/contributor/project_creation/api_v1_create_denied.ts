import { expect, request as playwrightRequest, test } from "@playwright/test";

const csrfTokenFromHtml = (html: string): string => {
  const inputToken = html.match(
    /name="csrfmiddlewaretoken"\s+value="([^"]+)"/,
  )?.[1];
  const scriptToken = html.match(
    /const csrfmiddlewaretoken = '([^']+)'/,
  )?.[1];
  return inputToken || scriptToken || "";
};

const authenticatedContributorContext = async (baseURL?: string) => {
  const context = await playwrightRequest.newContext({
    baseURL: baseURL || "http://localhost:2000",
  });

  const loginPage = await context.get("/login");
  const loginToken = csrfTokenFromHtml(await loginPage.text());
  expect(loginToken.length).toBeGreaterThan(0);

  const loginResponse = await context.post("/en-us/login/", {
    headers: {
      "X-CSRFToken": loginToken,
      Referer: loginPage.url(),
    },
    form: {
      csrfmiddlewaretoken: loginToken,
      username: "contributor",
      password: "contributor",
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const projectPage = await context.get("/admin/project/");
  expect(projectPage.ok()).toBeTruthy();
  expect(new URL(projectPage.url()).pathname).toContain("/admin/project/");

  const csrfToken = csrfTokenFromHtml(await projectPage.text());
  expect(csrfToken.length).toBeGreaterThan(0);

  return {
    context,
    csrfToken,
    referer: projectPage.url(),
  };
};

test.describe("Dashboard v1 create API permissions", () => {
  test("Anonymous cannot create dashboard via v1 endpoint", async ({
    baseURL,
  }) => {
    const anonymousContext = await playwrightRequest.newContext({
      baseURL: baseURL || "http://localhost:2000",
    });

    const response = await anonymousContext.post("/api/v1/dashboards/", {
      form: {
        name: "Anonymous Create Attempt",
        slug: `anonymous-create-${Date.now()}`,
        data: JSON.stringify({}),
      },
    });

    expect(response.status()).toBe(403);
    await response.json();

    await anonymousContext.dispose();
  });

  test("Contributor cannot create dashboard via v1 endpoint", async ({
    baseURL,
  }) => {
    const { context, csrfToken, referer } =
      await authenticatedContributorContext(baseURL);

    const response = await context.post("/api/v1/dashboards/", {
      timeout: 60_000,
      headers: {
        "X-CSRFToken": csrfToken,
        Referer: referer,
      },
      form: {
        name: "Unauthorized Create Attempt",
        slug: `unauthorized-create-${Date.now()}`,
        data: JSON.stringify({}),
      },
    });

    expect(response.status()).toBe(403);
    await response.json();
    await context.dispose();
  });
});
