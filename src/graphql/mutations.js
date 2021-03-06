import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { pick, isArray } from 'lodash';

import { getLoggedInUserQuery } from './queries';

const createOrderQuery = gql`
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      createdAt
      status
      createdByUser {
        id
      }
      fromCollective {
        id
        slug
      }
      collective {
        id
        slug
      }
      transactions(type: "CREDIT") {
        id
        uuid
      }
    }
  }
`;

export const createUserQuery = gql`
  mutation createUser($user: UserInputType!, $organization: CollectiveInputType, $redirect: String) {
    createUser(user: $user, organization: $organization, redirect: $redirect) {
      user {
        id
        email
      }
      organization {
        id
        slug
      }
    }
  }
`;

const createMemberQuery = gql`
  mutation createMember(
    $member: CollectiveAttributesInputType!
    $collective: CollectiveAttributesInputType!
    $role: String!
  ) {
    createMember(member: $member, collective: $collective, role: $role) {
      id
      createdAt
      member {
        id
        name
        image
        slug
        twitterHandle
        description
      }
      role
    }
  }
`;

const removeMemberQuery = gql`
  mutation removeMember(
    $member: CollectiveAttributesInputType!
    $collective: CollectiveAttributesInputType!
    $role: String!
  ) {
    removeMember(member: $member, collective: $collective, role: $role) {
      id
    }
  }
`;

const createCollectiveQuery = gql`
  mutation createCollective($collective: CollectiveInputType!) {
    createCollective(collective: $collective) {
      id
      name
      slug
      type
      website
      twitterHandle
    }
  }
`;

const editCollectiveQuery = gql`
  mutation editCollective($collective: CollectiveInputType!) {
    editCollective(collective: $collective) {
      id
      type
      slug
      name
      image
      backgroundImage
      description
      longDescription
      website
      twitterHandle
      githubHandle
      countryISO
      isActive
      hostFeePercent
      host {
        id
        createdAt
        slug
        name
        image
        backgroundImage
        settings
        description
        website
        twitterHandle
        stats {
          id
          collectives {
            hosted
          }
        }
      }
      members(roles: ["ADMIN", "MEMBER", "HOST"]) {
        id
        createdAt
        role
        description
        stats {
          totalDonations
        }
        tier {
          id
          name
        }
        member {
          id
          name
          image
          slug
          twitterHandle
          description
          ... on User {
            email
          }
        }
      }
      tiers {
        id
        slug
        type
        name
        description
        amount
        presets
        interval
        currency
        maxQuantity
      }
    }
  }
`;

const deleteCollectiveQuery = gql`
  mutation deleteCollective($id: Int!) {
    deleteCollective(id: $id) {
      id
    }
  }
`;

export const createApplicationMutation = gql`
  mutation createApplication($application: ApplicationInput!) {
    createApplication(application: $application) {
      id
      name
      description
      callbackUrl
      clientId
      clientSecret
    }
  }
`;

export const updateApplicationMutation = gql`
  mutation updateApplication($id: String!, $application: ApplicationInput!) {
    updateApplication(id: $id, application: $application) {
      id
      name
      description
      callbackUrl
    }
  }
`;

export const deleteApplicationMutation = gql`
  mutation deleteApplication($id: String!) {
    deleteApplication(id: $id) {
      id
    }
  }
`;

export const createVirtualCardsMutationQuery = gql`
  mutation createVirtualCards(
    $CollectiveId: Int!
    $numberOfVirtualCards: Int
    $emails: [String]
    $PaymentMethodId: Int
    $amount: Int
    $monthlyLimitPerMember: Int
    $description: String
    $expiryDate: String
    $currency: String
    $limitedToTags: [String]
    $limitedToCollectiveIds: [Int]
    $limitedToHostCollectiveIds: [Int]
    $limitedToOpenSourceCollectives: Boolean
    $customMessage: String
  ) {
    createVirtualCards(
      amount: $amount
      monthlyLimitPerMember: $monthlyLimitPerMember
      CollectiveId: $CollectiveId
      PaymentMethodId: $PaymentMethodId
      description: $description
      expiryDate: $expiryDate
      currency: $currency
      limitedToTags: $limitedToTags
      limitedToCollectiveIds: $limitedToCollectiveIds
      limitedToHostCollectiveIds: $limitedToHostCollectiveIds
      numberOfVirtualCards: $numberOfVirtualCards
      emails: $emails
      limitedToOpenSourceCollectives: $limitedToOpenSourceCollectives
      customMessage: $customMessage
    ) {
      id
      name
      uuid
      description
      initialBalance
      monthlyLimitPerMember
      expiryDate
      currency
      data
    }
  }
`;

export const addCreateOrderMutation = graphql(createOrderQuery, {
  props: ({ mutate }) => ({
    createOrder: order => mutate({ variables: { order } }),
  }),
});

export const addCreateMemberMutation = graphql(createMemberQuery, {
  props: ({ mutate }) => ({
    createMember: (member, collective, role) => mutate({ variables: { member, collective, role } }),
  }),
});

export const addRemoveMemberMutation = graphql(removeMemberQuery, {
  props: ({ mutate }) => ({
    removeMember: (member, collective, role) => mutate({ variables: { member, collective, role } }),
  }),
});

export const addEventMutations = compose(
  addCreateOrderMutation,
  addCreateMemberMutation,
  addRemoveMemberMutation,
);

export const addCreateCollectiveMutation = graphql(createCollectiveQuery, {
  props: ({ mutate }) => ({
    createCollective: async collective => {
      const CollectiveInputType = pick(collective, [
        'slug',
        'type',
        'name',
        'image',
        'description',
        'longDescription',
        'location',
        'countryISO',
        'twitterHandle',
        'githubHandle',
        'website',
        'tags',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'HostCollectiveId',
        'ParentCollectiveId',
        'data',
        CollectiveInputType,
      ]);
      CollectiveInputType.tiers = (collective.tiers || []).map(tier =>
        pick(tier, ['type', 'name', 'description', 'amount', 'maxQuantity', 'maxQuantityPerUser']),
      );
      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long']);
      return await mutate({
        variables: { collective: CollectiveInputType },
        update: (store, { data: { createCollective } }) => {
          const data = store.readQuery({ query: getLoggedInUserQuery });
          data.LoggedInUser.memberOf.push({
            __typename: 'Member',
            collective: createCollective,
            role: 'ADMIN',
          });
          store.writeQuery({ query: getLoggedInUserQuery, data });
        },
      });
    },
  }),
});

export const addEditCollectiveMutation = graphql(editCollectiveQuery, {
  props: ({ mutate }) => ({
    editCollective: async collective => {
      const CollectiveInputType = pick(collective, [
        'id',
        'type',
        'slug',
        'name',
        'company',
        'description',
        'longDescription',
        'tags',
        'expensePolicy',
        'website',
        'twitterHandle',
        'githubHandle',
        'countryISO',
        'location',
        'startsAt',
        'endsAt',
        'timezone',
        'maxAmount',
        'currency',
        'quantity',
        'ParentCollectiveId',
        'HostCollectiveId',
        'image',
        'backgroundImage',
        'settings',
        'hostFeePercent',
      ]);

      if (isArray(collective.tiers)) {
        CollectiveInputType.tiers = collective.tiers.map(tier =>
          pick(tier, [
            'id',
            'type',
            'name',
            'description',
            'amount',
            'interval',
            'maxQuantity',
            'maxQuantityPerUser',
            'presets',
          ]),
        );
      }
      if (isArray(collective.members)) {
        CollectiveInputType.members = collective.members.map(member => {
          return {
            id: member.id,
            role: member.role,
            description: member.description,
            member: {
              name: member.member.name,
              email: member.member.email,
            },
          };
        });
      }
      CollectiveInputType.location = pick(collective.location, ['name', 'address', 'lat', 'long']);
      return await mutate({ variables: { collective: CollectiveInputType } });
    },
  }),
});

export const addDeleteCollectiveMutation = graphql(deleteCollectiveQuery, {
  props: ({ mutate }) => ({
    deleteCollective: async id => {
      return await mutate({ variables: { id } });
    },
  }),
});
