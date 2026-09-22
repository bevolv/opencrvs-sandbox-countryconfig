##########################################################################
# Tiltfile: OpenCRVS Country config developer
# For more information about variables, please check:
# https://github.com/opencrvs/infrastructure/blob/develop/Tiltfile

# OpenCRVS core images tag:
# For releases it's ok to keeps same as branch_or_tag
core_images_tag = os.getenv("OPENCRVS_CORE_IMAGE_TAG", "v2.0.2")

# FIXME: Put release version
core_ref = os.getenv("OPENCRVS_CORE_REF", "release/2.0.0")

# Local image ref MUST contain a "/" so the Helm helper does not prefix
# ghcr.io/opencrvs/ (see charts/.../_image-registry-helper.tpl).
# For minikube, run before tilt up:
#   eval $(minikube docker-env)
countryconfig_image_name = os.getenv("COUNTRYCONFIG_IMAGE_NAME", "local/ocrvs-countryconfig")
countryconfig_image_tag = os.getenv("COUNTRYCONFIG_IMAGE_TAG", "local")

allow_k8s_contexts('minikube')


# Internal variable for helm charts checkout
core_charts_dir = ".opencrvs-core-charts"

core_repo_url = 'https://github.com/opencrvs/opencrvs-core.git'

charts_ready = (
  os.path.exists('{}/charts/dependencies'.format(core_charts_dir)) and
  os.path.exists('{}/charts/opencrvs-services'.format(core_charts_dir))
)

if charts_ready:
  print("Using existing OpenCRVS Helm charts in {}...".format(core_charts_dir))
else:
  print("Cloning OpenCRVS Helm charts from {}...".format(core_repo_url))
  local("""
    rm -rf {core_charts_dir}
    git clone \
      --depth 1 \
      --filter=blob:none \
      --sparse \
      --branch {core_ref} \
      {core_repo_url} \
      {core_charts_dir}

    cd {core_charts_dir}
    git sparse-checkout set charts
  """.format(
    core_ref=core_ref,
    core_charts_dir=core_charts_dir,
    core_repo_url=core_repo_url
  ))

if not os.path.exists('{core_charts_dir}/charts/dependencies'.format(core_charts_dir=core_charts_dir)) or not os.path.exists('{core_charts_dir}/charts/opencrvs-services'.format(core_charts_dir=core_charts_dir)):
  fail('Something went wrong while cloning infrastructure repository!')

load('./tilt/opencrvs.tilt', 'setup_opencrvs')

# Build countryconfig image
docker_build(
  "{0}:{1}".format(countryconfig_image_name, countryconfig_image_tag), 
  ".",
  dockerfile="Dockerfile",
  network="host",
  only=[
    './src',
    './package.json',
    './yarn.lock',
    './tsconfig.json',
    './start-prod.sh',
    './Dockerfile'
  ],
  live_update=[
    # Fallback to full rebuild if dependencies change
    fall_back_on(['package.json', 'yarn.lock', 'Dockerfile']),
    # Sync source code changes
    sync('./src', '/usr/src/app/src'),
    # Sync start script if it changes
    sync('./start-prod.sh', '/usr/src/app/start-prod.sh'),
  ]
)


# Build image with postgres and metabase assets
docker_build("{0}:{1}-assets".format(countryconfig_image_name, countryconfig_image_tag), ".",
              dockerfile="Dockerfile.assets",
              network="host",
              only=[
                'infrastructure/metabase',
                'infrastructure/postgres',
                'infrastructure/deployment',
                './Dockerfile.assets'
              ]
)

setup_opencrvs(
    opencrvs_chart_repo=core_charts_dir,
    core_images_tag=core_images_tag,
    countryconfig_image_name=countryconfig_image_name,
    countryconfig_image_tag=countryconfig_image_tag,
)

print("✅ Tiltfile configuration loaded successfully.")
