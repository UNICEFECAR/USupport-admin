import { getMultipleClientsDataByIDs } from "#queries/clients";
import {
  assignProviderToOrganizationQuery,
  checkProvidersFutureConsultationsForOrgQuery,
  createOrganizationQuery,
  editOrganizationQuery,
  getAllOrganizationsQuery,
  getAllOrganizationsWithDetailsQuery,
  getConsultationsForOrganizationsQuery,
  getOrganizationByIdQuery,
  getProviderConsultationsForOrganizationQuery,
  getProviderOrganizationLinkQuery,
  reassignProviderToOrganizationQuery,
  removeProviderFromOrganizationQuery,
  createOrganizationWorkWithLinksQuery,
  getOrganizationWorkWithLinksQuery,
  deleteOrganizationWorkWithLinksQuery,
  createOrganizationSpecialisationsLinksQuery,
  deleteOrganizationSpecialisationsLinksQuery,
  getOrganizationSpecialisationsLinksQuery,
  getOrganizationMetadataQuery,
} from "#queries/organizations";
import { getMultipleProvidersDataByIDs } from "#queries/providers";
import {
  organizationExists,
  organizationNotFound,
  providerAlreadyAssignedToOrg,
} from "#utils/errors";
import { removeProvidersCacheRequest } from "#utils/helperFunctions";

export const createOrganization = async (data) => {
  try {
    return await createOrganizationQuery({
      ...data,
      districtId: data.district,
    })
      .then(async (res) => {
        const organizationId = res.rows[0].organization_id;

        if (data.workWith && data.workWith.length > 0) {
          await createOrganizationWorkWithLinksQuery({
            poolCountry: data.country,
            organizationId,
            workWithIds: data.workWith,
          });

          if (data.specialisations && data.specialisations.length > 0) {
            await createOrganizationSpecialisationsLinksQuery({
              poolCountry: data.country,
              organizationId,
              specialisationIds: data.specialisations,
            });
          }
        }

        return res.rows[0];
      })
      .catch((err) => {
        // Check if the error is due to duplicate organization name
        if (err.code === "23505") {
          throw organizationExists(data.language);
        }
        throw err;
      });
  } catch (error) {
    throw error;
  }
};

export const editOrganization = async (data) => {
  try {
    return await editOrganizationQuery({
      ...data,
      districtId: data.district,
    })
      .then(async (res) => {
        const organizationId = res.rows[0].organization_id;

        if (data.workWith !== undefined) {
          const existingLinks = await getOrganizationWorkWithLinksQuery({
            poolCountry: data.country,
            organizationId,
          });

          const existingWorkWithIds = existingLinks.rows.map(
            (link) => link.organization_work_with_id
          );
          const newWorkWithIds = data.workWith || [];

          const workWithIdsToAdd = newWorkWithIds.filter(
            (id) => !existingWorkWithIds.includes(id)
          );

          const workWithIdsToRemove = existingWorkWithIds.filter(
            (id) => !newWorkWithIds.includes(id)
          );

          if (workWithIdsToAdd.length > 0) {
            await createOrganizationWorkWithLinksQuery({
              poolCountry: data.country,
              organizationId,
              workWithIds: workWithIdsToAdd,
            });
          }

          if (workWithIdsToRemove.length > 0) {
            await deleteOrganizationWorkWithLinksQuery({
              poolCountry: data.country,
              organizationId,
              workWithIds: workWithIdsToRemove,
            });
          }
        }

        if (data.specialisations !== undefined) {
          const existingLinks = await getOrganizationSpecialisationsLinksQuery({
            poolCountry: data.country,
            organizationId,
          });

          const existingSpecialisationIds = existingLinks.rows.map(
            (link) => link.organization_specialisation_id
          );
          const newSpecialisationIds = data.specialisations || [];

          const specialisationIdsToAdd = newSpecialisationIds.filter(
            (id) => !existingSpecialisationIds.includes(id)
          );

          const specialisationIdsToRemove = existingSpecialisationIds.filter(
            (id) => !newSpecialisationIds.includes(id)
          );

          if (specialisationIdsToAdd.length > 0) {
            await createOrganizationSpecialisationsLinksQuery({
              poolCountry: data.country,
              organizationId,
              specialisationIds: specialisationIdsToAdd,
            });
          }

          if (specialisationIdsToRemove.length > 0) {
            await deleteOrganizationSpecialisationsLinksQuery({
              poolCountry: data.country,
              organizationId,
              specialisationIds: specialisationIdsToRemove,
            });
          }
        }

        return res.rows[0];
      })
      .catch((err) => {
        // Check if the error is due to duplicate organization name
        if (err.code === "23505") {
          throw organizationExists(data.language);
        }
        throw err;
      });
  } catch (error) {
    throw error;
  }
};

export const assignProviderToOrganization = async (data) => {
  const assignedProviders = await getProviderOrganizationLinkQuery(data)
    .then((res) => {
      if (res.rows.length === 0) {
        return false;
      }
      return res.rows;
    })
    .catch((err) => {
      throw err;
    });

  const assignedProviderIds = assignedProviders
    ? assignedProviders.map((x) => x.provider_detail_id)
    : [];
  const notAssignedProviders = data.providerDetailIds.filter(
    (x) => !assignedProviderIds.includes(x)
  );

  if (notAssignedProviders.length > 0) {
    await assignProviderToOrganizationQuery({
      organizationId: data.organizationId,
      providerDetailIds: notAssignedProviders,
      country: data.country,
    })
      .then((res) => {
        if (res.rows.length === 0) {
          throw providerAlreadyAssignedToOrg(data.language);
        }
        return res.rows[0];
      })
      .catch((err) => {
        throw err;
      });
  }
  if (assignedProviderIds.length > 0) {
    await reassignProviderToOrganizationQuery({
      organizationId: data.organizationId,
      providerDetailIds: assignedProviderIds,
      country: data.country,
    }).catch((err) => {
      console.log("err");
      throw err;
    });
  }

  await removeProvidersCacheRequest({
    providerIds: data.providerDetailIds,
    country: data.country,
    language: data.language,
  });

  return { success: true };
};

export const getAllOrganizations = async (data) => {
  return await getAllOrganizationsQuery(data)
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });
};

export const getAllOrganizationsWithDetails = async (data) => {
  const organizations = await getAllOrganizationsWithDetailsQuery(data)
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });

  const ids = organizations.map((org) => org.organization_id);

  const consultations = await getConsultationsForOrganizationsQuery({
    country: data.country,
    organizationIds: ids,
  })
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });

  const organizationsWithDetails = organizations.map((org) => {
    const consultationsForOrg = consultations.find(
      (x) => x.organization_id === org.organization_id
    );
    if (!consultationsForOrg) {
      return {
        ...org,
        totalConsultations: 0,
        uniqueProviders: org.providers?.filter((x) => !!x)?.length || 0,
        uniqueClients: 0,
      };
    }

    return {
      ...org,
      totalConsultations: consultationsForOrg.consultations_count,
      uniqueProviders: org.providers.length,
      uniqueClients: consultationsForOrg.clients_count,
    };
  });

  return organizationsWithDetails;
};

export const getOrganizationById = async (data) => {
  const organization = await getOrganizationByIdQuery(data).then((res) => {
    if (res.rows.length === 0) {
      throw organizationNotFound(data.language);
    }
    return res.rows[0];
  });

  const providerDetailIds = organization.providers.map(
    (x) => x.provider_detail_id
  );

  let providersData = await getMultipleProvidersDataByIDs({
    providerDetailIds,
    poolCountry: data.country,
  }).then((res) => {
    return res.rows;
  });

  if (data.search) {
    providersData = providersData.filter((x) => {
      return (
        x.name.toLowerCase().includes(data.search.toLowerCase()) ||
        x.surname.toLowerCase().includes(data.search.toLowerCase()) ||
        x.patronym.toLowerCase().includes(data.search.toLowerCase())
      );
    });
  }

  const providerConsultationsForOrg =
    await getProviderConsultationsForOrganizationQuery({
      organizationId: organization.organization_id,
      country: data.country,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      weekdays: data.weekdays,
      weekends: data.weekends,
      search: data.search,
    }).then((res) => {
      return res.rows;
    });

  const futureConsultationsForProviders =
    await checkProvidersFutureConsultationsForOrgQuery({
      providerDetailIds,
      organizationId: organization.organization_id,
      country: data.country,
    })
      .then((res) => {
        return res.rows || [];
      })
      .catch((err) => {
        throw err;
      });

  const allClientIds = Array.from(
    new Set(
      providerConsultationsForOrg.reduce((acc, x) => {
        if (x.consultations) {
          const ids = x.consultations.map((y) => y.client_detail_id);
          acc.push(...ids);
        }
        return acc;
      }, [])
    )
  );

  const allClients = await getMultipleClientsDataByIDs({
    poolCountry: data.country,
    clientDetailIds: allClientIds,
  })
    .then((res) => {
      return res.rows || [];
    })
    .catch((err) => {
      throw err;
    });

  const includedProvidersDetailIds = providersData.map(
    (x) => x.provider_detail_id
  );

  for (let i = 0; i < organization.providers.length; i++) {
    const provider = organization.providers[i];

    if (!includedProvidersDetailIds.includes(provider.provider_detail_id)) {
      delete organization.providers[i];
      continue;
    }

    const dataForProvider = providersData.find(
      (x) => x.provider_detail_id === provider.provider_detail_id
    );

    const consultationsDataForProvider = providerConsultationsForOrg.find(
      (x) => x.provider_detail_id === provider.provider_detail_id
    ) || {
      consultations_count: 0,
      clients_count: 0,
      consultations: [],
    };

    const futureConsultationsForProvider =
      futureConsultationsForProviders.find(
        (x) => x.provider_detail_id === provider.provider_detail_id
      )?.count || 0;

    consultationsDataForProvider.consultations =
      consultationsDataForProvider.consultations.map((x) => {
        const consultationClient = allClients.find(
          (y) => y.client_detail_id === x.client_detail_id
        );
        return {
          ...x,
          clientName: `${consultationClient.name || ""} ${
            consultationClient.surname || ""
          }`,
        };
      });

    organization.providers[i] = {
      ...provider,
      ...dataForProvider,
      ...consultationsDataForProvider,
      future_consultations: futureConsultationsForProvider,
    };
  }

  organization.providers = organization.providers.filter((x) => !!x);

  return organization;
};

export const removeProviderFromOrganization = async (data) => {
  return await removeProviderFromOrganizationQuery(data)
    .then(async (res) => {
      await removeProvidersCacheRequest({
        providerIds: [data.providerDetailId],
        country: data.country,
        language: data.language,
      });

      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};

export const getOrganizationMetadata = async (data) => {
  return await getOrganizationMetadataQuery(data)
    .then((res) => {
      if (res.rows.length === 0) {
        return {
          workWith: [],
          districts: [],
          paymentMethods: [],
          userInteractions: [],
          specialisations: [],
        };
      }
      return res.rows[0];
    })
    .catch((err) => {
      throw err;
    });
};
