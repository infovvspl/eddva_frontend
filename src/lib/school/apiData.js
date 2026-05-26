export function getResponseData(responseOrData) {
  const payload = responseOrData?.data ?? responseOrData;
  return payload?.data ?? payload;
}

export function getResponseList(responseOrData) {
  const data = getResponseData(responseOrData);
  return Array.isArray(data) ? data : [];
}

export function notifyDataChanged(resource) {
  window.dispatchEvent(new CustomEvent('eddva:data-changed', { detail: { resource } }));
}
