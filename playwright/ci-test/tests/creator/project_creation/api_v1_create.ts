import { expect, request as playwrightRequest, test } from "@playwright/test";
import fs from "fs";
import path from "path";

const SOURCE_DASHBOARD_SLUG = "demo-geosight-project";
const TEST_ICON_PATH = path.resolve(
  __dirname,
  "../../../../../django_project/geosight/data_restorer/demo_data/countries_data/icon.png",
);
const TEST_ICON_BUFFER = fs.readFileSync(TEST_ICON_PATH);

const csrfTokenFromHtml = (html: string): string => {
  const inputToken = html.match(
    /name="csrfmiddlewaretoken"\s+value="([^"]+)"/,
  )?.[1];
  const scriptToken = html.match(
    /const csrfmiddlewaretoken = '([^']+)'/,
  )?.[1];
  return inputToken || scriptToken || "";
};

const authenticatedCreatorContext = async (baseURL?: string) => {
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
      username: "creator",
      password: "creator",
    },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const projectPage = await context.get("/admin/project/");
  expect(projectPage.ok()).toBeTruthy();
  const csrfToken = csrfTokenFromHtml(await projectPage.text());
  expect(csrfToken.length).toBeGreaterThan(0);

  return {
    context,
    csrfToken,
    referer: projectPage.url(),
  };
};

const buildPayloadFromRealDashboard = async (
  context: any,
  name: string,
  slug: string,
): Promise<Record<string, string>> => {
  const sourceResponse = await context.get(
    `/api/dashboard/${SOURCE_DASHBOARD_SLUG}/data`,
  );
  expect(sourceResponse.ok()).toBeTruthy();

  const sourceDashboard = await sourceResponse.json();
  const referenceLayerIdentifier =
    sourceDashboard?.reference_layer?.identifier || "";
  const groupName = sourceDashboard?.group || "Test";

  const nestedData = {
    ...sourceDashboard,
    name,
    slug,
    reference_layer: referenceLayerIdentifier,
    geoField:
      sourceDashboard?.geo_field ||
      sourceDashboard?.geoField ||
      "geometry_code",
    featured: false,
  };

  return {
    name,
    slug,
    group: groupName,
    geoField: nestedData.geoField,
    data: JSON.stringify(nestedData),
  };
};

test.describe("Dashboard v1 create API", () => {
  test.describe.configure({ mode: "serial" });

  test("Creator can create dashboard using real dashboard payload", async ({
    baseURL,
  }) => {
    const { context, csrfToken, referer } = await authenticatedCreatorContext(
      baseURL,
    );
    const uniqueSuffix = Date.now();
    const name = `API V1 Create ${uniqueSuffix}`;
    const slug = `api-v1-create-${uniqueSuffix}`;
    const payload = await buildPayloadFromRealDashboard(context, name, slug);

    const createResponse = await context.post("/api/v1/dashboards/", {
      timeout: 60_000,
      headers: {
        "X-CSRFToken": csrfToken,
        Referer: referer,
      },
      form: payload,
    });

    expect(createResponse.status()).toBe(201);
    const createdDashboard = await createResponse.json();
    expect(createdDashboard.slug).toBe(slug);
    expect(createdDashboard.name).toBe(name);

    const deleteResponse = await context.delete(`/api/v1/dashboards/${slug}/`, {
      timeout: 60_000,
      headers: {
        "X-CSRFToken": csrfToken,
        Referer: referer,
      },
    });
    expect(deleteResponse.status()).toBe(204);
    await context.dispose();
  });

  test("Creator can create dashboard with multipart icon upload", async ({
    baseURL,
  }) => {
    const { context, csrfToken, referer } = await authenticatedCreatorContext(
      baseURL,
    );
    const uniqueSuffix = Date.now() + 1;
    const name = `API V1 Multipart ${uniqueSuffix}`;
    const slug = `api-v1-multipart-${uniqueSuffix}`;
    const payload = await buildPayloadFromRealDashboard(context, name, slug);

    const createResponse = await context.post("/api/v1/dashboards/", {
      timeout: 60_000,
      headers: {
        "X-CSRFToken": csrfToken,
        Referer: referer,
      },
      multipart: {
        ...payload,
        icon: {
          name: "integration-icon.png",
          mimeType: "image/png",
          buffer: TEST_ICON_BUFFER,
        },
      },
    });

    expect(createResponse.status()).toBe(201);
    const createdDashboard = await createResponse.json();
    expect(createdDashboard.slug).toBe(slug);

    const deleteResponse = await context.delete(`/api/v1/dashboards/${slug}/`, {
      timeout: 60_000,
      headers: {
        "X-CSRFToken": csrfToken,
        Referer: referer,
      },
    });
    expect(deleteResponse.status()).toBe(204);
    await context.dispose();
  });

  test("Creator receives validation error for invalid payload", async ({
    baseURL,
  }) => {
    const { context, csrfToken, referer } = await authenticatedCreatorContext(
      baseURL,
    );

    const response = await context.post("/api/v1/dashboards/", {
      timeout: 60_000,
      headers: {
        "X-CSRFToken": csrfToken,
        Referer: referer,
      },
      form: {
        name: `API V1 Invalid ${Date.now()}`,
        slug: `api-v1-invalid-${Date.now()}`,
        data: JSON.stringify({}),
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.detail).toContain("extent");
    await context.dispose();
  });
});
