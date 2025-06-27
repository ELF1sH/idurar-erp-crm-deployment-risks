Частотность выполнения запросов
```
sum(rate(http_requests_total[5m])) by (route)
```

95th Percentile Response Time by Route
```
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

```
app_memory_usage_bytes{type="heapUsed"}
```

```
email_endpoint_in_progress
```

Business Outcomes
```
sum(rate(email_endpoint_business_outcome_total[5m])) by (outcome)
```

Requests per Second

```
sum(rate(email_endpoint_business_outcome_total[5m])) by (outcome)
```

95th Percentile Response Time
```
histogram_quantile(0.95, sum(rate(email_endpoint_duration_seconds_bucket[5m])) by (le))
```

Request Size (95th percentile)
```
histogram_quantile(0.95, sum(rate(email_endpoint_request_size_bytes_bucket[5m])) by (le))
```

Response Size (95th percentile)
```
histogram_quantile(0.95, sum(rate(email_endpoint_response_size_bytes_bucket[5m])) by (le))
```

Errors per Second by Type
```
sum(rate(email_endpoint_errors_total[5m])) by (error_type)
```

Success Rate
```
sum(rate(email_endpoint_business_outcome_total{outcome=~"success"}[5m])) / sum(rate(email_endpoint_requests_total[5m]))
```
