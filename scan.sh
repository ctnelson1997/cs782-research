PROJ_ROOT_DIR="/c/Users/ColeNelson/Desktop/cs782-research/anonymized_submissions"
PROJ_HW=$1
PROJ_SUB=$2
PROJ_SEM=$3
PROJ_FULL_DIR="${PROJ_ROOT_DIR}/${PROJ_HW}/${PROJ_SUB}"
SQ_HOST="http://localhost:9000"
SQ_TOKEN=`cat sqtoken.secret`

echo $PROJ_FULL_DIR

MSYS_NO_PATHCONV=1 docker run \
    --rm \
    -e SONAR_HOST_URL=$SQ_HOST \
    -e SONAR_SCANNER_OPTS="-Dsonar.projectKey=${PROJ_SEM}_${PROJ_HW}_${PROJ_SUB} -Dsonar.projectName=${PROJ_SEM}_${PROJ_HW}_${PROJ_SUB} -Dsonar.analysis.hw=${PROJ_HW} -Dsonar.analysis.sub=${PROJ_SUB} -Dsonar.analysis.sem=${PROJ_SEM} -Dsonar.exclusions=**/odc-reports/** -Dsonar.scm.disabled=true -Dsonar.dependencyCheck.jsonReportPath=/usr/src/odc-reports/dependency-check-report.json -Dsonar.dependencyCheck.htmlReportPath=/usr/src/odc-reports/dependency-check-report.html" \
    -e SONAR_LOGIN="${SQ_TOKEN}" \
	--network=host \
    -v "${PROJ_FULL_DIR}"/:/usr/src:z \
	-v /usr/src/node_modules \
	-v /usr/src/.git \
    sonarsource/sonar-scanner-cli
