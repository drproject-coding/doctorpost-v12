/**
 * @typedef {object} BrandProfile
 * @property {string} id
 * @property {string} name
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} companyName
 * @property {string} role
 * @property {string} openAIKey
 * @property {string} industry
 * @property {string[]} audience
 * @property {string[]} tones
 * @property {string[]} offers
 * @property {string[]} taboos
 * @property {object} styleGuide
 * @property {boolean} styleGuide.emoji
 * @property {number} styleGuide.hashtags
 * @property {string} styleGuide.links
 * @property {string} copyGuideline
 * @property {string} contentStrategy
 * @property {string} definition
 */

/**
 * @typedef {object} User
 * @property {string} id
 * @property {string} [googleId]
 * @property {string} [email]
 * @property {string} [name]
 * @property {string} [picture]
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [companyName]
 * @property {string} [role]
 * @property {string} [industry]
 */

/**
 * @typedef {'draft' | 'scheduled' | 'published' | 'to-review' | 'to-plan' | 'to-publish'} PostStatus
 */

/**
 * @typedef {object} ScheduledPost
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string} scheduledAt
 * @property {string} pillar
 * @property {PostStatus} status
 * @property {string} [userId]
 */

/**
 * @typedef {object} AnalyticsData
 * @property {number} totalImpressions
 * @property {number} totalReactions
 * @property {number} totalComments
 * @property {number} ctr
 * @property {object} topPerformingPillar
 * @property {string} topPerformingPillar.name
 * @property {number} topPerformingPillar.value
 * @property {object} topPerformingHook
 * @property {string} topPerformingHook.name
 * @property {number} topPerformingHook.value
 * @property {Array<object>} performanceByPillar
 * @property {string} performanceByPillar.name
 * @property {number} performanceByPillar.impressions
 * @property {string[]} trendingTopics
 * @property {object} creatorEngagement
 * @property {number} creatorEngagement.averageCommentsPerPost
 * @property {number} creatorEngagement.averageReactionsPerPost
 * @property {number} creatorEngagement.followerGrowthRate
 */

/**
 * @typedef {object} SubtopicSuggestion
 * @property {string} id
 * @property {string} text
 * @property {string} source
 * @property {number} [relevanceScore]
 * @property {number} [searchVolume]
 */

/**
 * @typedef {object} PostRecommendation
 * @property {string} postType
 * @property {string} hookPattern
 * @property {string} contentPillar
 * @property {string} toneId
 * @property {number} confidence
 * @property {object} reasoning
 * @property {string} reasoning.postType
 * @property {string} reasoning.hookPattern
 * @property {string} reasoning.contentPillar
 * @property {string} reasoning.tone
 * @property {string[]} compatiblePostTypes
 * @property {string[]} compatibleHookPatterns
 * @property {string[]} compatibleContentPillars
 * @property {string[]} compatibleTones
 */

/**
 * @typedef {object} DropdownOption
 * @property {string} id
 * @property {string} value
 * @property {string} label
 * @property {string} category
 * @property {string} description
 * @property {string} exampleSnippet
 * @property {string[]} useCases
 * @property {'high' | 'medium' | 'experimental'} [performanceIndicator]
 * @property {boolean} [isTrending]
 */

/**
 * @typedef {'high' | 'medium' | 'experimental'} PerformanceIndicator
 */

/**
 * @typedef {'recommended' | 'caution' | 'not-recommended' | 'neutral'} CompatibilityStatus
 */

/**
 * @typedef {object} CompatibilityInfo
 * @property {CompatibilityStatus} status
 * @property {string} [reason]
 */

/**
 * @typedef {Record<string, CompatibilityInfo>} CompatibilityMap
 */

/**
 * @typedef {object} GeneratedPost
 * @property {string} content
 * @property {number} estimatedReadTime
 * @property {string[]} [hashtags]
 */

/**
 * @typedef {object} PostGenerationParameters
 * @property {string} topic
 * @property {string[]} audience
 * @property {string} [coreTakeaway]
 * @property {string} [ctaGoal]
 * @property {string} contentPillar
 * @property {string} hookPattern
 * @property {string} postType
 * @property {string} toneId
 * @property {number} triggerGeneration
 */

/**
 * @typedef {object} TonePrompt
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} promptTemplate
 */