# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-09-20

### Added
- Current `check`, `track`, and `meter` APIs for entitlement and usage workflows.
- Typed `checkout.create` support for idempotent plan and credit-pack purchases.
- Typed `events.list` support for filtered, cursor-paginated developer-event history.
- Typed entitlement decisions, account quota state, overage details, and replay state.
- Caller-supplied or generated idempotency keys for usage writes.
- Published, type-checked examples for check/track, checkout, and developer-event pagination.

### Changed
- Test keys now use `https://sandbox.usagey.com/v1`; live keys use `https://api.usagey.com/v1`.
- Added an explicit `environment` option and retained `baseUrl` for local or self-hosted versioned API roots.
- `Usagey` is the primary client export; `UsageyClient` remains a deprecated alias.
- Expected billing denials are returned as domain results instead of transport exceptions.

### Removed
- Legacy API-key management, usage statistics, and `/api/usage` event-list methods.

## [0.1.1] - 2024-05-18

### Added
- Initial release with core functionality
- Usage tracking features
- API key management
- Usage statistics
- Full TypeScript support

### Changed
- None

### Fixed
- None
