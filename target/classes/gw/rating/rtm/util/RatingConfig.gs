package gw.rating.rtm.util

uses gw.api.system.PCConfigParameters

@Export
class RatingConfig {

  @Deprecated("MemoryThreshold is no longer used","8.0.3")
  property get MemoryThreshold() : int {
    return PCConfigParameters.RateTableManagementMemoryRowThreshold.Value
  }

  property get RTMRowCountNormalizationThreshold() : int {
    return PCConfigParameters.RateTableManagementNormalizationRowThreshold.Value
  }

  property get RTMRowCountNormalizationLimit() : int {
    return PCConfigParameters.RateTableManagementNormalizationRowLimit.Value
  }
}
